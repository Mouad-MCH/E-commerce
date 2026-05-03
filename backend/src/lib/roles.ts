import type { UserRole } from "../db/schema.js";

const VALID: readonly UserRole[] = ["customer", "support", "admin"];

export const parseRole = (value: unknown) => {
    if(typeof value === "string" && (VALID as readonly string[]).includes(value)) {
        return value as UserRole;
    }

    return "customer";
}

export const isAdmin = (role: UserRole) => {
    return role === "admin";
}

export const isStaff = (role: UserRole) => {
    return role === "support" || role === "admin"
}