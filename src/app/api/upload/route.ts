import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    const uploadDir = join(process.cwd(), "data", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePaths = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create a safe filename
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        return `/public/uploads/${fileName}`;
      })
    );

    return NextResponse.json({ filePaths });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
} 