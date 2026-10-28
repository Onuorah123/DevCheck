
import { db, client } from "./db.js";

async function testDatabase() {
    try {
        await client`SELECT 1`;

        console.log("Bona database connection successful!");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        await client.end();
    }
}

testDatabase();
