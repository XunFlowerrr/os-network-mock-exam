import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dataPath = path.join(process.cwd(), "src", "data");
  const files = fs.readdirSync(dataPath);
  // Return only .json files
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  return NextResponse.json(jsonFiles);
}
