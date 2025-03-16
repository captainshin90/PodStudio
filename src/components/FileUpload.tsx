import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (filePaths: string[]) => void;
}

const FileUpload = ({ onUpload }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        setIsUploading(true);
        const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);

        if (validFiles.length !== acceptedFiles.length) {
          toast({
            title: "Files Skipped",
            description: "Some files were larger than 10MB and were skipped",
            variant: "destructive",
          });
        }

        if (validFiles.length === 0) return;

        const formData = new FormData();
        validFiles.forEach(file => {
          formData.append("files", file);
        });
        // call the backend file upload endpoint
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // check if the upload was successful
        if (!response.ok) throw new Error("Upload failed");

        // get the file paths from the response
        const data = await response.json();
        onUpload(data.file_paths);
      } catch (error: any) {
        toast({
          title: "Upload Error",
          description: error.message || "Failed to upload files",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
    },
    maxSize: 10 * 1024 * 1024,  // max size of 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted"}
        ${isUploading ? "pointer-events-none opacity-50" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select files"}
        </p>
        <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
      </div>
    </div>
  );
}

export default FileUpload; 