const sourceTagRegex = new RegExp("\\[.*?\\]", "g");
const text = "Some text [PHB] and more text.";
const cleanContent = text.replace(sourceTagRegex, "");
console.log(`Original: "${text}"`);
console.log(`Cleaned:  "${cleanContent}"`);

const text2 = "Feature: [Cool Feature]";
const clean2 = text2.replace(sourceTagRegex, "");
console.log(`Original: "${text2}"`);
console.log(`Cleaned:  "${clean2}"`);

// Test the newline regex too
const multiNewlineRegex = new RegExp("\\n{3,}", "g");
const text3 = "Line 1\n\n\n\nLine 2";
console.log(`Newlines: "${text3.replace(multiNewlineRegex, "\n\n")}"`); // Should be Line 1\n\nLine 2
