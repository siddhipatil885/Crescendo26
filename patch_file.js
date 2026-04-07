const fs = require('fs');
let code = fs.readFileSync('ai-server/index.js', 'utf8');

// Replace buildDescription
code = code.replace(/function buildDescription\(text, category, subcategory, labelHint = ""\) \{[\s\S]*?return buildTemplateDescription\(category, subcategory, labelList\);\n\}/m, 
`function buildDescription(text, category, subcategory, labelHint = "") {
  const cleanedText = cleanDescription(text);
  const cropped = cleanedText.split(" ").filter(Boolean).slice(0, 40).join(" ");

  if (countWords(cropped) >= 4 && !looksLikeLabelList(cropped) && !isWeakDescription(cropped)) {
    return ensureSentence(cropped);
  }

  // The user explicitly requested: "if the ai isnt able to do it then just dont enter anything"
  return "";
}`);

// Replace classifyCaption
code = code.replace(/function classifyCaption\(caption\) \{[\s\S]*?return normalizeImageAnalysis\(matchedRule\.category, matchedRule\.subcategory, caption, 0\.65\);\n\}/m, 
`function classifyCaption(caption) {
  // We matched keywords previously, but keyword-matching on ImageNet classes leads to extremely inaccurate civic outputs.
  // The user requested no hardcoded text: "if the ai isnt able to do it then just dont enter anything"
  return FINAL_FALLBACK_ANALYSIS;
}`);

fs.writeFileSync('ai-server/index.js', code);
