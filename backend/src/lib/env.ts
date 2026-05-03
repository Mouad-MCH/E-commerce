import { z } from "zod";
import { env as loadEnv } from 'custom-env'
import { config } from 'dotenv'


process.env.NODE_ENV = process.env.NODE_ENV || "development";

const isDevelopment = process.env.NODE_ENV === "development";
const isTesting = process.env.NODE_ENV === "test";


if(isDevelopment) {
    config()
}else if(isTesting) {
    loadEnv("test")
}


const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"])
    .default("development"),

    PORT: z.coerce.number().positive().default(3001),
    
    DATABASE_URL: z.string().min(1).startsWith("postgresql://"),

    CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    POLAR_API_BASE_URL: z.string().url().default("https://api.polar.com"),
    POLAR_CHECK_PRODUCT_ID: z.string().uuid(),

    SENTRY_DSN: z.string().url(),

    STREAM_API_KEY: z.string().min(1),
    STREAM_API_SECRET: z.string().min(1),

    IMAGEKIT_PUBLIC_KEY: z.string().min(1),

    FRONTEND_URL: z.string().url()
});

export type ENV = z.infer<typeof envSchema>;

let env:ENV;

try {
    env = envSchema.parse(process.env);
}catch (err) {
    if(err instanceof z.ZodError) {
        console.log("❌ Invalid environment variables:");
        console.error(JSON.stringify(err.flatten().fieldErrors, null, 2));

        err.issues.forEach(issue => {
            console.error(`- ${issue.path.join(".")}: ${issue.message}`);
        })

        process.exit(1);
    }
    throw err;
}

export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";


export default env;