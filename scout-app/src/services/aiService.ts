import { GoogleGenAI } from '@google/genai';
import { Candidate } from '../data/mockCandidates';

// Warning: In a production app, never expose your API key on the frontend.
// For this prototype/demo, we use it directly or fallback to mock data.
const API_KEY = " ";

export interface AIResult {
  matchScore: number;
  explainability: string;
}

export interface ChatMessage {
  role: 'agent' | 'candidate';
  content: string;
}

export interface EngagementResult {
  interestScore: number;
  summary: string;
  transcript: ChatMessage[];
}

export async function matchCandidates(jd: string, candidates: Candidate[]): Promise<(Candidate & AIResult)[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      You are an expert AI recruiter. Evaluate these candidates against the following Job Description.
      
      Job Description:
      ${jd}
      
      Candidates:
      ${JSON.stringify(candidates, null, 2)}
      
      For each candidate, provide a Match Score (0-100) and a 1-sentence explainability for why they match or don't match.
      Return the output as a strict JSON array of objects with keys: "id", "matchScore" (number), "explainability" (string).
      Do not include markdown blocks or any other text, just the JSON array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const results = JSON.parse(cleanText) as { id: string; matchScore: number; explainability: string }[];
    
    const mapped = candidates.map(c => {
      const result = results.find(r => r.id === c.id);
      return {
        ...c,
        matchScore: result?.matchScore || 50,
        explainability: result?.explainability || "Average match based on keyword overlap."
      };
    });

    // Sort descending by match score
    return mapped.sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.warn("AI API Failed or Quota Exceeded. Using robust local fallback for demo.", error);
    // Local fallback for robust demo
    return candidates.map(c => {
      const jdLower = jd.toLowerCase();
      let score = 40;
      let explain = "Lacks core requirements.";
      
      const matchedSkills = c.skills.filter(s => jdLower.includes(s.toLowerCase()));
      if (matchedSkills.length > 0) {
        score += matchedSkills.length * 10;
        explain = `Matches key skills: ${matchedSkills.join(', ')}.`;
      }
      if (jdLower.includes(c.role.toLowerCase().split(' ')[0])) {
        score += 20;
        explain += " Role title aligns well.";
      }
      
      return {
        ...c,
        matchScore: Math.min(98, score),
        explainability: explain
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}

export async function simulateChat(candidate: Candidate, jd: string): Promise<EngagementResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      Simulate a brief 4-message exchange between an AI Recruiter and a Candidate.
      
      Job Description Context: ${jd}
      Candidate Profile: ${JSON.stringify(candidate)}
      
      The AI Recruiter should reach out regarding the role and ask a qualifying question (e.g., about salary, location, or a specific skill).
      The Candidate should respond authentically based on their profile. If their salary expectation is met or they are a good fit, they should be interested. If not, they might be hesitant.
      
      Output strict JSON with this format:
      {
        "interestScore": <number 0-100 based on candidate response>,
        "summary": "<1 sentence summary of their interest level>",
        "transcript": [
          {"role": "agent", "content": "<message>"},
          {"role": "candidate", "content": "<message>"},
          {"role": "agent", "content": "<message>"},
          {"role": "candidate", "content": "<message>"}
        ]
      }
      Do not include markdown blocks or any other text, just the JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as EngagementResult;

  } catch (error) {
    console.warn("AI API Failed for chat simulation. Using local fallback.", error);
    
    // Simulate delay for effect
    await new Promise(r => setTimeout(r, 2000));
    
    return {
      interestScore: 85,
      summary: `${candidate.name} is highly interested but wants to confirm remote flexibility.`,
      transcript: [
        { role: 'agent', content: `Hi ${candidate.name}, I came across your impressive background. We have a ${candidate.role} position that aligns perfectly with your skills. Are you currently open to new opportunities?` },
        { role: 'candidate', content: `Hello! Yes, I am actively looking and the role sounds interesting.` },
        { role: 'agent', content: `Great! The role offers up to ${candidate.expectedSalary}. Does this align with your expectations, and are you comfortable with the location requirements?` },
        { role: 'candidate', content: `Yes, the compensation is exactly what I'm looking for. I am based in ${candidate.location} and ready to start.` }
      ]
    };
  }
}
