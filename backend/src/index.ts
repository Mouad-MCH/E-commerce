import express from "express"
import cors from "cors"
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import env from "./lib/env";


const app = express();

const rawJson = express.raw({ type: 'application/json', limit: "1mb" }) 
app.use(cors())
app.use(clerkMiddleware())

app.post('/webhooks/clerk', rawJson, (req, res) => {
    void clerkWebhookHandler(req, res)
})

app.use(express.json())



app.listen(env.PORT, () => {
    console.log(`server running on http://localhost:${env.PORT}`)
})