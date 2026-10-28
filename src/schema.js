
import {
    pgTable,
    bigint,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const errorLogs = pgTable("error_logs", {
    id: bigint("id", { mode: "number" })
        .primaryKey()
        .generatedAlwaysAsIdentity(),

    errorCode: text("error_code").notNull(),

    errorMessage: text("error_message").notNull(),

    aiAnalysis: text("ai_analysis").notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
});
export const aiExplanation = pgTable("ai_explanations",{
    id:bigint("id",{mode:"number"})
    .primaryKey()
    .generatedAlwaysAsIdentity(),

    question : text("question").notNull(),

    explanation :text("explanation").notNull(),

    createdAt :timestamp("created_at",{
        withTimezone:true,
    }).notNull().defaultNow()
});