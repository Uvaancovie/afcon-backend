// Test Gemini API Key
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB9lj7CRtvM50JUh1YYlw_AaVuVeXp69dM';

console.log('Testing API Key:', API_KEY.substring(0, 15) + '...');

const ai = new GoogleGenerativeAI(API_KEY);

async function testKey() {
  try {
    // Try different model names
    const modelNames = [
      "gemini-1.5-flash",
      "gemini-pro",
      "gemini-1.5-pro"
    ];
    
    for (const modelName of modelNames) {
      console.log(`\nTrying model: ${modelName}`);
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with model: ${modelName}`);
        console.log('Response:', text);
        return;
      } catch (err: any) {
        console.log(`❌ Failed with ${modelName}:`, err.message);
      }
    }
    
    console.error('\n❌ All models failed!');
  } catch (error: any) {
    console.error('❌ API Key is INVALID!');
    console.error('Error:', error.message);
    if (error.errorDetails) {
      console.error('Details:', JSON.stringify(error.errorDetails, null, 2));
    }
  }
}

testKey();
