import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: DATABASE_URL,
  },
  migrations: {
    async adapter() {
      if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
      return new PrismaPg(DATABASE_URL);
    },
  },
} as Parameters<typeof defineConfig>[0]);
