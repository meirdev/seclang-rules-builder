package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/corazawaf/coraza/v3"
)

type Condition struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
	Name     string `json:"name,omitempty"`
}

var phaseMap = map[string]int{
	"REMOTE_ADDR":             1,
	"REMOTE_HOST":             1,
	"REMOTE_PORT":             1,
	"REMOTE_USER":             1,
	"SERVER_ADDR":             1,
	"SERVER_NAME":             1,
	"SERVER_PORT":             1,
	"REQUEST_METHOD":          1,
	"REQUEST_PROTOCOL":        1,
	"REQUEST_URI":             1,
	"REQUEST_URI_RAW":         1,
	"REQUEST_FILENAME":        1,
	"REQUEST_BASENAME":        1,
	"REQUEST_LINE":            1,
	"QUERY_STRING":            1,
	"REQUEST_HEADERS":         1,
	"REQUEST_HEADERS_NAMES":   1,
	"REQUEST_COOKIES":         1,
	"REQUEST_COOKIES_NAMES":   1,
	"ARGS_GET":                1,
	"ARGS_GET_NAMES":          1,
	"HTTP_HOST":               1,
	"GEO":                     1,
	"REQUEST_BODY":            2,
	"REQUEST_BODY_LENGTH":     2,
	"ARGS":                    2,
	"ARGS_NAMES":              2,
	"ARGS_POST":               2,
	"ARGS_POST_NAMES":         2,
	"ARGS_COMBINED_SIZE":      2,
	"FILES":                   2,
	"FILES_NAMES":             2,
	"FILES_SIZES":             2,
	"FILES_COMBINED_SIZE":     2,
	"REQBODY_PROCESSOR":       2,
	"XML":                     2,
	"RESPONSE_STATUS":         3,
	"RESPONSE_PROTOCOL":       3,
	"RESPONSE_HEADERS":        3,
	"RESPONSE_HEADERS_NAMES":  3,
	"RESPONSE_CONTENT_TYPE":   3,
	"RESPONSE_CONTENT_LENGTH": 3,
	"RESPONSE_BODY":           4,
}

func phaseForVariable(variable string) int {
	base := variable
	if idx := strings.Index(variable, ":"); idx != -1 {
		base = variable[:idx]
	}
	if p, ok := phaseMap[base]; ok {
		return p
	}
	return 1
}

func conditionToSecLang(c Condition, id int, isChained bool, isLast bool) string {
	variable := c.Field
	if c.Name != "" {
		variable = fmt.Sprintf("%s:%s", c.Field, c.Name)
	}

	phase := phaseForVariable(c.Field)
	operatorValue := fmt.Sprintf("%s %s", c.Operator, c.Value)

	var actions string
	if isChained && !isLast {
		actions = fmt.Sprintf("id:%d,phase:%d,chain", id, phase)
	} else {
		actions = fmt.Sprintf("id:%d,phase:%d,deny,status:403", id, phase)
	}

	return fmt.Sprintf(`SecRule %s "%s" "%s"`, variable, operatorValue, actions)
}

func andGroupToSecLang(group []Condition, id int) string {
	if len(group) == 0 {
		return ""
	}

	isChained := len(group) > 1
	lines := make([]string, len(group))
	for i, c := range group {
		lines[i] = conditionToSecLang(c, id, isChained, i == len(group)-1)
	}
	return strings.Join(lines, "\n")
}

// convertToSecLang(dnfJSON: string): string
// Input:  JSON array of AND-groups: [[Condition, ...], ...]
// Output: JSON { rules: string[], errors: string[] }
func convertToSecLangJS(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return errorResult("missing argument")
	}

	var dnf [][]Condition
	if err := json.Unmarshal([]byte(args[0].String()), &dnf); err != nil {
		return errorResult(fmt.Sprintf("invalid JSON: %v", err))
	}

	baseID := 1000
	if len(args) > 1 {
		baseID = args[1].Int()
	}

	rules := make([]string, 0, len(dnf))
	for i, group := range dnf {
		rule := andGroupToSecLang(group, baseID+i)
		if rule != "" {
			rules = append(rules, rule)
		}
	}

	result, _ := json.Marshal(map[string]any{
		"rules":  rules,
		"errors": []string{},
	})
	return string(result)
}

// validateSecLang(ruleText: string): string
// Input:  SecLang rule string
// Output: JSON { valid: bool, error?: string }
func validateSecLangJS(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return errorResult("missing argument")
	}

	ruleText := args[0].String()

	waf, err := coraza.NewWAF(coraza.NewWAFConfig().
		WithDirectives(ruleText))
	_ = waf

	if err != nil {
		result, _ := json.Marshal(map[string]any{
			"valid": false,
			"error": err.Error(),
		})
		return string(result)
	}

	result, _ := json.Marshal(map[string]any{
		"valid": true,
	})
	return string(result)
}

func errorResult(msg string) string {
	result, _ := json.Marshal(map[string]any{
		"error": msg,
	})
	return string(result)
}

func main() {
	c := make(chan struct{})
	js.Global().Set("convertToSecLang", js.FuncOf(convertToSecLangJS))
	js.Global().Set("validateSecLang", js.FuncOf(validateSecLangJS))
	<-c
}
