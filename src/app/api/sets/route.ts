import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const noRandomPath = path.join(process.cwd(), "src", "data", "no-random");
  const randomPath = path.join(process.cwd(), "src", "data", "random");

  const noRandomFiles = fs.existsSync(noRandomPath)
    ? fs.readdirSync(noRandomPath).filter(file => file.endsWith(".json"))
    : [];

  const randomFiles = fs.existsSync(randomPath)
    ? fs.readdirSync(randomPath).filter(file => file.endsWith(".json"))
    : [];

  return NextResponse.json({ noRandom: noRandomFiles, random: randomFiles });
}

export async function POST(request: Request) {
  try {
    const { name, data } = await request.json();
    const dataPath = path.join(process.cwd(), "src", "data");
    const filePath = path.join(dataPath, `${name}.json`);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "Set already exists." },
        { status: 400 }
      );
    }

    // Write the JSON data to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({ message: "Set saved successfully." });
  } catch (error) {
    console.error("Error saving set:", error);
    return NextResponse.json(
      { message: "Failed to save set." },
      { status: 500 }
    );
  }
}
