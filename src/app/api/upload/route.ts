import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const type = data.get("type") as string || "image"; // Allow specifying type

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename based on type
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    let filename: string;
    
    switch (type) {
      case "logo":
        filename = `logo_${timestamp}.${extension}`;
        break;
      case "slider":
        filename = `slider_${timestamp}.${extension}`;
        break;
      default:
        filename = `image_${timestamp}.${extension}`;
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    try {
      await writeFile(path.join(uploadDir, filename), buffer);
    } catch (error) {
      // If directory doesn't exist, create it and try again
      const fs = require("fs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
      } else {
        throw error;
      }
    }

    // Return the public URL
    const imageUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      filename 
    });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 