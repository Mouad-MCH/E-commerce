import express from "express"
import cors from "cors"

import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import env from "./lib/env";
import keepAliveCron from "./lib/cron";

import fs from "node:fs"
import path from "node:path"

import meRouter from "./routes/me.route";
import productRouter from "./routes/product.route";
import streamRouter from "./routes/stream.route";
import checkoutRouter from "./routes/checkout.route";


const app = express();

const rawJson = express.raw({ type: 'application/json', limit: "1mb" }) 
app.use(cors())
app.use(clerkMiddleware())

app.post('/webhooks/clerk', rawJson, (req, res) => {
    void clerkWebhookHandler(req, res)
})

/* app.post('/webhooks/polar', rawJson, (req, res) => {
    void polarWebhookHandler(req, res)
}) */

app.use(express.json())

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true })
})

app.use("/api/me", meRouter)
app.use("/api/products", productRouter)
app.use("/api/stream", streamRouter)
app.use("/api/checkout", checkoutRouter)

const publicDir = path.join(process.cwd(), "public");
if(fs.existsSync(publicDir)) {
    app.use(express.static(publicDir))

    app.get("/*any", (req, res, next) => {
        if(req.method !== "GET" && req.method !== "HEAD"){
            next();
            return;
        }

        if(!req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
            next();
            return;
        }

        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    })
}


// todo: add error handler middlewere

app.listen(env.PORT, () => {
    console.log(`server running on http://localhost:${env.PORT}`)
    if(env.NODE_ENV === "production") {
        keepAliveCron.start()
    }
})