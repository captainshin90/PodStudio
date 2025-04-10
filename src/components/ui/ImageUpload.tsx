import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onUpload: (imagePath: string) => void;
  maxSize?: number;
}

////////////////////////////////////////////////////////////
// ImageUpload component
////////////////////////////////////////////////////////////
export function ImageUpload({
  onUpload,
  maxSize = 5242880, // 5MB default
}: ImageUploadProps) {
  const { toast } = useToast();
  
  // Upload single image to server
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUpload(data.filePath);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  // Dropzone onDrop handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await uploadImage(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
    },
    maxSize,
    multiple: false,
  });

  ////////////////////////////////////////////////////////////
  // Render the component
  ////////////////////////////////////////////////////////////
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {isDragActive ? (
            <p>Drop the image here</p>
          ) : (
            <p>Drag and drop an image here, or click to select</p>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Accepted types: JPG, PNG, GIF, WebP (max {Math.round(maxSize / 1048576)}MB)
        </div>
      </div>
    </div>
  );
} 