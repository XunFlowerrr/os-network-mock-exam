import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const projectRoot = process.cwd();

    // Step 1: Fetch latest changes
    console.log("Fetching latest changes...");
    await execAsync("git fetch origin", { cwd: projectRoot });

    // Step 2: Add data directory
    console.log("Adding data directory...");
    await execAsync("git add ./src/data", { cwd: projectRoot });

    // Step 3: Check if there are changes to commit
    const { stdout: statusOutput } = await execAsync("git status --porcelain ./src/data", { cwd: projectRoot });

    if (!statusOutput.trim()) {
      return NextResponse.json({
        success: true,
        message: "No changes to sync - data directory is already up to date"
      });
    }

    // Step 4: Commit changes
    console.log("Committing changes...");
    await execAsync('git commit -m "add new question set"', { cwd: projectRoot });

    // Step 5: Push to remote
    console.log("Pushing to remote...");
    await execAsync("git push origin HEAD", { cwd: projectRoot });

    return NextResponse.json({
      success: true,
      message: "Successfully synced question sets to GitHub"
    });

  } catch (error: any) {
    console.error("Git sync error:", error);

    // Handle specific git errors
    if (error.stderr?.includes("nothing to commit")) {
      return NextResponse.json({
        success: true,
        message: "No changes to sync - data directory is already up to date"
      });
    }

    if (error.stderr?.includes("no upstream branch")) {
      return NextResponse.json({
        success: false,
        message: "No upstream branch configured. Please set up remote tracking branch."
      }, { status: 400 });
    }

    if (error.stderr?.includes("Authentication failed")) {
      return NextResponse.json({
        success: false,
        message: "Git authentication failed. Please check your credentials."
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: `Sync failed: ${error.message || "Unknown error"}`
    }, { status: 500 });
  }
}
