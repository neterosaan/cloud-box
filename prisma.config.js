import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // This is for your application queries (Port 6543)
    //url: process.env.DATABASE_URL,
    
    // This is for Prisma migrations/schema changes (Port 5432)
    // @js-ignore - Prisma 7 types are currently missing this property
    url: process.env.DIRECT_URL 
  },
});