
import express from "express";
import cors from "cors";
import "dotenv/config";
import Groq from "groq-sdk";
import { Paystack } from "@paystack/paystack-sdk";
import { randomUUID } from "node:crypto";

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const paystack = new Paystack(
    process.env.PAYSTACK_SECRET_KEY
);

// Temporary conversation storage
const conversations = new Map();

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to DevCheck",
        status: "running",
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DevCheck server is running",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/check-groq", async (req, res) => {
    try {
        const response = await groq.models.list();

        return res.status(200).json({
            success: true,
            message: "Groq authentication worked",
            modelsFound: response.data.length,
        });
    } catch (error) {
        console.error("Groq authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Groq authentication failed",
        });
    }
});

app.post("/api/chat", async (req, res) => {
    const { message, conversationId } = req.body ?? {};

    if (typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid message",
        });
    }

    if (
        conversationId !== undefined &&
        (typeof conversationId !== "string" || conversationId.trim() === "")
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid conversation ID",
        });
    }

    const id = conversationId || randomUUID();

    const systemMessage = {
        role: "system",
        content: `You are DevCheck AI, a friendly and professional coding assistant.
Explain programming concepts in simple English.
Help users debug errors step by step.
Be patient and encouraging.
Use practical code examples when helpful.`,
    };

    if (!conversations.has(id)) {
        conversations.set(id, [systemMessage]);
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
        history.pop();

        console.error("Groq API error:", error.message);

        return res.status(500).json({
            success: false,
            message: "DevCheck could not generate a response",
        });
    }
});

app.post("/payment", async (req, res) => {
    try {
        const { email, amount } = req.body ?? {};

        if (
            typeof email !== "string" ||
            email.trim() === "" ||
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid email and positive numeric amount",
            });
        }

        const response = await paystack.transaction.initialize({
            email: email.trim(),
            amount: Math.round(amount * 100),
        });

        if (!response.status || !response.data) {
            return res.status(400).json({
                success: false,
                message: "Unable to initialize payment",
            });
        }

        return res.status(200).json({
            success: true,
            authorization_url: response.data.authorization_url,
            reference: response.data.reference,
        });
    } catch (error) {
        console.error("Paystack SDK error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to initialize payment",
        });
    }
});

// Export the Express app for Vercel.
export default app;

// Start a local server when running directly with Node.js.
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`DevCheck server running on port ${PORT}`);
    });
}
