import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "",
  // ...other environment variables...
};
