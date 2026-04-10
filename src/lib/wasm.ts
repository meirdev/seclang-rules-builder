export interface WasmAPI {
  validateSecLang(rule: string): { valid: boolean; error?: string };
}

declare global {
  class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
  }
  function validateSecLang(rule: string): string;
}

let wasmReady: Promise<WasmAPI> | null = null;

export function initWasm(): Promise<WasmAPI> {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    // wasm_exec.js is loaded via <script> in index.html
    const go = new Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch("/seclang.wasm"),
      go.importObject,
    );
    go.run(result.instance);

    return {
      validateSecLang(rule: string) {
        const raw = globalThis.validateSecLang(rule);
        return JSON.parse(raw);
      },
    };
  })();

  return wasmReady;
}
