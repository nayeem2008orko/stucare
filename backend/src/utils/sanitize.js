// sanitize.js
// Cleans user input before it touches the database or AI prompts
// Prevents XSS, prompt injection, and other input-based attacks

// Characters and patterns that could be used for prompt injection
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all |previous |above )?instructions/i,
  /system prompt/i,
  /you are now/i,
  /disregard/i,
  /forget (all |your |previous )?instructions/i,
  /act as (a |an )?/i,
  /jailbreak/i,
  /\[INST\]/i,
  /<\|system\|>/i,
];

function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[<>]/g, "") // remove remaining angle brackets
    .trim();
}

function sanitizeChatMessage(message) {
  const cleaned = sanitizeText(message);

  const isInjection = PROMPT_INJECTION_PATTERNS.some((pattern) =>
    pattern.test(cleaned),
  );

  if (isInjection) {
    return { safe: false, cleaned };
  }

  if (cleaned.length > 2000) {
    return { safe: false, cleaned };
  }

  return { safe: true, cleaned };
}

function sanitizeObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeText(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { sanitizeText, sanitizeChatMessage, sanitizeObject };
