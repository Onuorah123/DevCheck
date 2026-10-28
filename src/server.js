import express from "express";
import Groq from "groq-sdk";
import "dotenv/config";
import {randomUUID} from "node:crypto";
import { Paystack } from "@paystack/paystack-sdk";
console.log(
    "Paystack key loaded:",
    Boolean(process.env.PAYSTACK_SECRET_KEY)
);



const app = express();

 app.use(express.json());
const PORT = process.env.PORT || 3000;

const groq = new Groq({
     apiKey:process.env.GROQ_API_KEY,
});
const conversations = new Map()
app.use(express.json());

app.get("/",async(req,res) =>{
    return res.status(200).json({
        success:true,
        message:"Welcome to Dev check",
        status:"running",
    });
});


app.get("/api/health",async(req,res) =>{
    return res.status(200).json({
        success:true,
        message:"Dev check server is running",
        timestamp:new Date().toISOString(),
    })
});

app.get("/api/check-groq",async(req,res)=>{
    try{
        const response = await groq.models.list();
         return res.json({
            success:true,
            message:'Groq authentication worked',
            modelsfound: response.data.length
         })
    }catch(error){
        console.log("Groq authentication check:",error.message);

        return res.status(500).json({
            success:false,
            message:"Groq authentication failed"
        });
    }
});



app.post("/api/chat",async(req,res)=>{
    const {message,conversationId} = req.body ?? {};
     
    if(typeof message !== "string"|| message.trim()===""){
        return res.status(400).json({
        success:false,
        message:" Please provide a valid messsage"
});
    }

    let id = conversationId;
    if(id && typeof id !== "string"){
        return res.status(400).json({
            success:false,
            message:"Conversation Id must be required"
        })
    };
    if(!id) {
        id= randomUUID();
    }
    const systemMesssage = {
         role: "system",
        content: `You are DevCheck AI, a friendly and professional coding assistant.

Explain programming concepts in simple English.
Help users debug errors step by step.
Be patient and encouraging.
Use practical code examples when helpful.`,

    }
    if(!conversations.has(id)){
        conversations.set(id,[systemMesssage]);
    }
    const history = conversations.get(id);
     history.push({
        role: "user",
        content: message.trim(),
    });

    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: history,
        });

        const reply =
            response.choices[0]?.message?.content ||
            "No response generated.";

        history.push({
            role: "assistant",
            content: reply,
        });

        return res.status(200).json({
            success: true,
            conversationId: id,
            reply,
        });
    } catch (error) {
        // Remove the user message if the AI request fails.
        history.pop();

        console.error("Groq API error:", error.message);

        return res.status(500).json({
            success: false,
            message: "DevCheck could not generate a response",
        });
    }
});
 const paystack = new Paystack(
     process.env.PAYSTACK_SECRET_KEY
 );
 
 
 app.post("/payment" ,async(req,res)=>{
     try{
         const {email,amount} = req.body;
         if(!email || !amount){
             return res.status(400).json({
                 success:false,
                 message:"Please provide a valid email address and amount"
             })
         }
         const response = await paystack.transaction.initialize({
             email:email,
             amount:amount*100
         });
         if(!response.status){
             return res.status(400).json({
                 success:false,
                 error:error.message
             })
         }
         res.status(200).json({
             success:true,
             authorization_url:response.data.authorization_url,
             reference:response.data.reference
         });
     }catch(error){
         console.log("Paystack SDK ERROR:",error)
         return res.status(500).json({
             success:false,
             error:error.message
         })
     }
 });



app.listen(PORT,() =>{
    console.log(`Dev check server running at http://localhost:${PORT}`)
});