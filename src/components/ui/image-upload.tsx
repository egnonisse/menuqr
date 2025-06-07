"use client";

import { useState, useRef } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  onRemoveImage?: () => void;
  className?: string;
  type?: string; // Type of upload (logo, slider, etc.)
}

export default function ImageUpload({
  onImageUpload,
  currentImage,
  onRemoveImage,
  className = "",
  type = "image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        onImageUpload(result.imageUrl);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Erreur lors de l'upload de l'image: ${errorMessage}`);
      setPreviewUrl(currentImage || "");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onRemoveImage?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm">Upload en cours...</div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {isUploading ? "Upload en cours..." : "Cliquer pour uploader une image"}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            JPEG, PNG, WebP (max 5MB)
          </span>
        </button>
      )}
    </div>
  );
} 