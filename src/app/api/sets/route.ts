import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "src", "data");

    // Recursive function to scan directories and collect all files
    const scanDirectory = (dirPath: string, relativePath: string = ""): any[] => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      let files: any[] = [];

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;

        if (item.isDirectory()) {
          // Recursively scan subdirectory
          const subFiles = scanDirectory(itemPath, itemRelativePath);
          files = files.concat(subFiles);
        } else if (item.name.endsWith('.json')) {
          // Add JSON file with its full path
          files.push({
            name: item.name.replace('.json', ''),
            path: itemRelativePath.replace('.json', ''),
            folder: relativePath.split('/')[0] || relativePath, // Get root folder
            fullPath: itemRelativePath
          });
        }
      }

      return files;
    };

    // Scan all folders and collect files
    const rootItems = fs.readdirSync(dataPath, { withFileTypes: true });
    const allFiles: any[] = [];

    for (const item of rootItems) {
      if (item.isDirectory()) {
        const folderPath = path.join(dataPath, item.name);
        const files = scanDirectory(folderPath, item.name);
        allFiles.push(...files);
      }
    }

    // Group files by their root folder
    const foldersMap = new Map();
    for (const file of allFiles) {
      const rootFolder = file.folder;
      if (!foldersMap.has(rootFolder)) {
        foldersMap.set(rootFolder, []);
      }
      foldersMap.get(rootFolder).push(file);
    }

    const folders = Array.from(foldersMap.entries()).map(([name, files]) => ({
      name,
      files: files.map((f: any) => f.name)
    }));

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error reading sets:", error);
    return NextResponse.json(
      { message: "Failed to read sets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, data, folder = "random" } = await request.json();

    // Validate folder name
    if (!folder || typeof folder !== 'string' || folder.trim() === '') {
      return NextResponse.json(
        { message: "Valid folder path is required" },
        { status: 400 }
      );
    }

    const dataPath = path.join(process.cwd(), "src", "data");
    const folderPath = path.join(dataPath, folder);

    // Create the folder path recursively if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, `${name}.json`);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "Set already exists in this folder." },
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
