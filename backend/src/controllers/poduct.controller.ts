import type { Request, Response, NextFunction } from "express";
import { products } from "../db/schema";
import { db } from "../db/index";
import { and, desc, eq } from "drizzle-orm";


export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cat = typeof req.query.category === "string" ? req.query.category.trim() : "";

        const activeOnly = eq(products.active, true);

        const whereClause = cat ? and(activeOnly, eq(products.category, cat)): activeOnly

        const rows = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(desc(products.createAt))

        res.json({ products: rows })

    }catch(error) {
        next(error)
    }
}

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const rows = await db
            .select({ category: products.category })
            .from(products)
            .where(eq(products.active, true));

        const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b));

        res.json({ categories })
    }catch(error) {
        next(error)
    }
}

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const [row] = await db
            .select()
            .from(products)
            .where(eq(products.slug, req.params.slug as string))
            .limit(1)

        if(!row || !row.active) {
            return res.status(400).json({ error: "Not found" });
        }


        res.json({product: row})

    }catch(error) {
        next(error)
    }
}