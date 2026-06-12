const { GoogleGenAI } = require("@google/genai");

async function list() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in environment variables.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join("\n"));
  } catch (e) {
    console.error(e);
  }
}

list();
