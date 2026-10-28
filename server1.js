import express from "express";
import cors from "cors";
import "dotenv/config";
import { Paystack,} from "@paystack/paystack-sdk";

const app = express();
const PORT = process.env.PORT || 3000
app.use(express.json());
app.use(cors());
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
app.listen(PORT,()=>{
    console.log(`PAYSTACK Api running on http://localhost:${PORT}`);
})