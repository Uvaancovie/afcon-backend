import Groq from "groq-sdk";
import dotenv from 'dotenv';
import path from 'path';

// Define Team interface locally
interface Team {
  name: string;
  score?: number;
}

// Ensure environment variables are loaded from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.GROQ_API_KEY;

console.log('🔑 Groq API Key loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('📂 Current directory:', __dirname);

if (!API_KEY) {
  console.error("❌ GROQ_API_KEY is not set in environment variables. Groq API calls will fail.");
  console.error("Current env keys:", Object.keys(process.env).filter(k => k.includes('GROQ')));
}

const groq = new Groq({ apiKey: API_KEY || 'dummy-key' });

const getPrompt = (
  type: 'goal' | 'event' | 'kickoff' | 'halftime' | 'fulltime',
  homeTeam: Team,
  awayTeam: Team,
  time: number
): string => {
  const score = `${homeTeam.name} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.name}`;
  
  switch (type) {
    case 'kickoff':
      return `Generate a short, exciting opening commentary for a soccer match between ${homeTeam.name} and ${awayTeam.name}. The atmosphere is electric. Keep it under 20 words.`;
    case 'goal':
      return `Generate a short, very exciting soccer commentary for a goal. The current score is ${score} at ${time} minutes. Describe the goal dramatically. Keep it under 25 words.`;
    case 'event':
      return `Generate a short soccer commentary. Match: ${homeTeam.name} vs ${awayTeam.name}. Score: ${score} at ${time} minutes. Mention a near-miss, great save, or skillful play. Keep it under 20 words.`;
    case 'halftime':
       return `Generate a brief halftime summary. Score: ${score}. Mention which team has momentum and what to expect in second half. Keep it under 30 words.`;
    case 'fulltime':
        return `Generate a concluding commentary for the match. Final score: ${score}. Summarize the result and key moments. Keep it under 35 words.`;
    default:
      return `Describe a generic event in a soccer match between ${homeTeam.name} and ${awayTeam.name}. The score is ${score}. Keep it under 20 words.`;
  }
};

export const generateCommentary = async (
  type: 'goal' | 'event' | 'kickoff' | 'halftime' | 'fulltime',
  homeTeam: Team,
  awayTeam: Team,
  time: number
): Promise<string> => {
  try {
    if (!API_KEY || API_KEY === 'dummy-key') {
      console.warn('⚠️ Groq API key not configured, using fallback commentary');
      return getFallbackCommentary(type, homeTeam, awayTeam, time);
    }
    
    const prompt = getPrompt(type, homeTeam, awayTeam, time);
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });
    
    return completion.choices[0]?.message?.content || getFallbackCommentary(type, homeTeam, awayTeam, time);
  } catch (error) {
    console.error('Error calling Groq API:', error);
    console.warn('Falling back to default commentary');
    return getFallbackCommentary(type, homeTeam, awayTeam, time);
  }
};

// Fallback commentary when API fails
const getFallbackCommentary = (
  type: 'goal' | 'event' | 'kickoff' | 'halftime' | 'fulltime',
  homeTeam: Team,
  awayTeam: Team,
  time: number
): string => {
  const score = `${homeTeam.score ?? 0}-${awayTeam.score ?? 0}`;
  
  switch (type) {
    case 'kickoff':
      return `The match between ${homeTeam.name} and ${awayTeam.name} is underway! Both teams looking sharp.`;
    case 'goal':
      return `GOAL! What a strike! ${homeTeam.name} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.name} at ${time} minutes!`;
    case 'event':
      return `Brilliant play at ${time} minutes! The crowd is on their feet as the action intensifies.`;
    case 'halftime':
      return `Half-time: ${homeTeam.name} ${score} ${awayTeam.name}. An exciting first half with plenty more to come!`;
    case 'fulltime':
      return `Full-time! ${homeTeam.name} ${score} ${awayTeam.name}. What a match! Both teams gave it their all.`;
    default:
      return `Exciting action between ${homeTeam.name} and ${awayTeam.name}!`;
  }
};
