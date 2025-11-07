
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Team } from '../types';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables. Gemini API calls will fail.");
  console.error("Current env keys:", Object.keys(process.env).filter(k => k.includes('GEMINI')));
}

const ai = new GoogleGenerativeAI(API_KEY || 'dummy-key');
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const getPrompt = (
  type: 'goal' | 'event' | 'kickoff' | 'halftime' | 'fulltime',
  homeTeam: Team,
  awayTeam: Team,
  time: number
): string => {
  const score = `${homeTeam.name} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.name}`;
  
  switch (type) {
    case 'kickoff':
      return `Generate a short, exciting opening commentary for a soccer match between ${homeTeam.name} and ${awayTeam.name}. The atmosphere is electric.`;
    case 'goal':
      return `Generate a short, very exciting soccer commentary for a goal. The current score is ${score} at ${time} minutes. Describe the goal in a dramatic way. Keep it under 30 words.`;
    case 'event':
      return `Generate a short, insightful piece of soccer commentary. The match is between ${homeTeam.name} and ${awayTeam.name}. The score is ${score} at ${time} minutes. Mention a near-miss, a great save, a skillful play, or rising tension. Keep it under 25 words.`;
    case 'halftime':
       return `Generate a brief summary commentary for halftime. The score is ${score}. Mention which team has the momentum and what the other team needs to do in the second half.`;
    case 'fulltime':
        return `Generate a concluding commentary for the end of a soccer match. The final score is ${score}. Summarize the result and the key moments of the game.`;
    default:
      return `Describe a generic event in a soccer match between ${homeTeam.name} and ${awayTeam.name}. The score is ${score}.`;
  }
};

export const generateCommentary = async (
  type: 'goal' | 'event' | 'kickoff' | 'halftime' | 'fulltime',
  homeTeam: Team,
  awayTeam: Team,
  time: number
): Promise<string> => {
  try {
    const prompt = getPrompt(type, homeTeam, awayTeam, time);
    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate commentary from Gemini API.');
  }
};
