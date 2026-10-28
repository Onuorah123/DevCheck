import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});
async function testAI(){
    try{
        const response = await ai.models.generateContent({
            model:"gemini-3.5-flash-lite",
            contents:"Who is the richest main in the world"
        })
        console.log("Gemini says:",response.text)
    }catch(error){
        console.log("Gemini request failed:",error.message)
    }
};
testAI();