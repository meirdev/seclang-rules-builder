package main

import (
	"strconv"
	"syscall/js"

	"github.com/corazawaf/coraza/v3"
)

// validateSecLang(ruleText: string): string
// Input:  SecLang rule string
// Output: JSON { "valid": bool, "error"?: string }
func validateSecLangJS(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return `{"valid":false,"error":"missing argument"}`
	}

	ruleText := args[0].String()

	_, err := coraza.NewWAF(coraza.NewWAFConfig().WithDirectives(ruleText))
	if err != nil {
		return `{"valid":false,"error":` + strconv.Quote(err.Error()) + `}`
	}
	return `{"valid":true}`
}

func main() {
	c := make(chan struct{})
	js.Global().Set("validateSecLang", js.FuncOf(validateSecLangJS))
	<-c
}
