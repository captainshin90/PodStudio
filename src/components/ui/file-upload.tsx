import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
// import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 5242880, // 5MB default
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: false,
  });

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
            <p>Drop the file here</p>
          ) : (
            <p>Drag and drop a file here, or click to select</p>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {accept ? `Accepted types: ${accept}` : "All file types accepted"}
        </div>
      </div>
    </div>
  );
} 