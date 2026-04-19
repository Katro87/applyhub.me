import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatbotResponse(message: string) {
  const systemPrompt = `
    You are the ApplyHub.me Assistant. Your goal is to explain how the platform works to users.
    ApplyHub.me is a hybrid job marketplace.
    Key features:
    - Job Seekers can browse and apply to jobs.
    - Free users have a limit of 1 application per week.
    - Clients (Employers) can post jobs for a fee ($5 for 2 postings).
    - Payments are manually verified by admins for security.
    - LeadGateway is our anchor featured company with 10 permanent jobs.
    - Jobs rotate every 30 days.
    - Users can track applications and save jobs.
    - Admin panel is for platform control and payment verification.
    
    Be helpful, professional, and concise.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [systemPrompt, message],
  });

  return response.text || "Sorry, I couldn't generate a response.";
}
