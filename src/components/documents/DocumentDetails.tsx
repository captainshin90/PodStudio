import { useState, useEffect } from "react";
import { Document, DocumentSourceFormat, DocumentType } from "@/lib/schemas/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { io } from "socket.io-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentDetailsProps {
  document: Document | null;
  onSave: (document: Document) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isReadOnly?: boolean;
}

// DocumentDetails component
// This component allows the user to view and edit the details of a document
// It uses the Document component to display the details of the document
// It also uses the Button component to save and cancel the changes

export default function DocumentDetails({
  document,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
  isReadOnly = false
}: DocumentDetailsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Document>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // use the useEffect hook to set the form data to the document details
  useEffect(() => {
    if (document) {
      // Ensure we have all required fields
      setFormData(document);
      setHasChanges(false);
      setIsEditable(false);
    } else if (isNew) {
      setFormData({
        doc_id: crypto.randomUUID(),
        doc_name: "",
        doc_desc: "",
        doc_type: "article" as DocumentType,
        topic_tags: [],
        doc_source_format: "txt" as DocumentSourceFormat,
        doc_source_url: "https://",
        doc_extracted_text: "",
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      setHasChanges(true);
      setIsEditable(true);
    } else {
      setFormData({});
      setHasChanges(false);
      setIsEditable(false);
    }
  }, [document, isNew]);

  if (!document && !isNew) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a document to view details or create a new document
    </div>;
  }

  // validate the url
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // handle the submit event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL before submission
    if (formData.doc_source_url && !validateUrl(formData.doc_source_url)) {
      setUrlError("Please enter a valid URL");
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL for the Source URL field",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData as Document);
      setHasChanges(false);
      setUrlError(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  // handle the change of the document details
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);

    // Validate URL on change
    if (name === "doc_source_url") {
      if (value && !validateUrl(value)) {
        setUrlError("Please enter a valid URL");
      } else {
        setUrlError(null);
      }
    }
  };

  // handle the file upload event
  const handleFileUpload = async (filePaths: string[]) => {
    setUploadedFiles((prev) => [...new Set([...prev, ...filePaths])]);
    
    // Simulate text extraction - in a real app, you'd process the file here
    // const simulatedExtractedText = "Extracted text from uploaded document...";

    // Update form with extracted text and detected format
    setFormData(prev => ({
      ...prev,
      // doc_extracted_text: simulatedExtractedText,
      doc_source_format: detectFileFormat(filePaths[0]),
      doc_source_url: filePaths[0]
    }));
    setHasChanges(true);

    toast({
      title: "Files Uploaded",
      description: `Successfully uploaded ${filePaths.length} files`,
    });
  };

  // detect the file format
  const detectFileFormat = (filePath: string): DocumentSourceFormat => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': return 'docx';
      case 'txt': return 'txt';
      default: return 'txt';
    }
  };

  // handle the extract text event
  const handleExtractText = async () => {
    if (!formData.doc_source_url && uploadedFiles.length === 0) {
      toast({
        title: "No Source",
        description: "Please provide a source URL or upload a file to extract text from",
        variant: "destructive",
      });
      return;
    }

    // Validate URL if provided
    if (formData.doc_source_url && !validateUrl(formData.doc_source_url)) {
      setUrlError("Please enter a valid URL");
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL for the Source URL field",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setLoading(true);

    try {
      // Create socket connection
      const socket = io({
        path: "/socket.io",
        reconnection: true,
        timeout: 10000,
      });

      // Handle cleanup
      const cleanup = () => {
        console.log("Cleaning up socket connection...");
        socket.disconnect();
        setIsExtracting(false);
        setLoading(false);
      };

      // connected to the server, get payload and call the extract_text server endpoint
      socket.on("connect", () => {
        console.log("Socket connected successfully");

        // Prepare URLs array with both source URL and uploaded files
        // Don't send both source URL and uploaded files
        const urls: string[] = [];
        if (formData.doc_source_url) {
          urls.push(formData.doc_source_url);
        }
        // urls.push(...uploadedFiles); - it's duplicate of formData.doc_source_url

        const payload = {
          text: "", // Empty text as we're extracting from URLs
          urls: urls,
          extract_tool: "podcastfy",
          secret_key: sessionStorage.getItem("secret_key") || "",
        };

        // call the extract_text server endpoint with the payload
        socket.emit("extract_text", payload);
      });

      // handle the progress event
      socket.on("progress", (data: { progress: number; message: string }) => {
        console.log("Progress:", data.message);
      });

      socket.on("error", (error: { message: string }) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        cleanup();
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        cleanup();
      });

      socket.on("complete", (data: { text: string }) => {
        console.log("Text extraction complete");
        setFormData(prev => ({
          ...prev,
          doc_extracted_text: data.text
        }));
        setHasChanges(true);
        cleanup();
      });

      // Handle component unmount
      return () => cleanup();
    } catch (error: any) {
      console.error("Error in handleExtractText:", error);
      setIsExtracting(false);
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "An error occurred while extracting text",
        variant: "destructive",
      });
    }
  }; // handle the extract text event

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  // return the document details component  
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header section: Cancel, Delete, Save buttons */}  
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          {isNew && (
            <h2 className="text-xl font-semibold">New Document</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {document && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!hasChanges}>
              {document ? "Save Changes" : "Save Document"}
            </Button>
          </div>
        </div>
      )}

      {/* Document upload section */}
      {isNew && (
        <div className="space-y-2">
          <div className="space-y-2">
            <FileUpload onUpload={handleFileUpload} />
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground/70">Uploaded Files</Label>
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {file.split('/').pop()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="doc_source_url" className="text-muted-foreground/70">Source URL</Label>
              <Input 
                id="doc_source_url"
                name="doc_source_url"
                value={formData.doc_source_url || ""}
                onChange={handleChange}
                className={urlError ? "border-red-500" : ""}
              />
              {urlError && (
                <p className="text-sm text-red-500">{urlError}</p>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleExtractText}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract Text"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Document details section */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="doc_id" className="text-muted-foreground/70">Document ID</Label>
            <Input
              id="doc_id"
              name="doc_id"
              value={formData.doc_id || ""}
              disabled
            />
          </div>    
        </div>
        <div className="space-y-1">
          <Label htmlFor="doc_name" className="text-muted-foreground/70">Document Name</Label>
          <Input
            id="doc_name"
            name="doc_name"
            placeholder="Enter Document Name"
            value={formData.doc_name || ""}
            onChange={handleChange}
            required
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="doc_desc" className="text-muted-foreground/70">Description</Label>
          <Textarea
            id="doc_desc"
            name="doc_desc"
            placeholder="Enter Document Description"
            value={formData.doc_desc || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="doc_type" className="text-muted-foreground/70">Document Type</Label>
            <Select
              value={formData.doc_type}
              onValueChange={(value: DocumentType) => {
                setFormData({ ...formData, doc_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="answer">Answer</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc_source_format" className="text-muted-foreground/70">Source Format</Label>
            <Select
              value={formData.doc_source_format}
              onValueChange={(value: DocumentSourceFormat) => {
                setFormData({ ...formData, doc_source_format: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Text</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="topic_tags" className="text-muted-foreground/70">Topic Tags (#topic/place/people/org/event. Lower case, no spaces, max 30 characters)</Label>
          <Input
            id="topic_tags"
            name="topic_tags"
            value={formData.topic_tags?.join(", ") || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                topic_tags: e.target.value.split(",").map((tag) => tag.trim())
              });
              setHasChanges(true);
            }}
            disabled={isReadOnly}
          />
        </div>
        {!isNew && (
          <div className="space-y-1">
            <Label htmlFor="doc_source_url" className="text-muted-foreground/70">Source URL</Label>
            <Input
              id="doc_source_url"
              name="doc_source_url"
              value={formData.doc_source_url || ""}
              onChange={handleChange}
              className={urlError ? "border-red-500" : ""}
              disabled={isReadOnly}
            />
            {urlError && (
              <p className="text-sm text-red-500">{urlError}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="doc_extracted_text" className="text-muted-foreground/70">Extracted Text</Label>
            {!isReadOnly && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_editable"
                  checked={isEditable}
                  onCheckedChange={setIsEditable}
                  disabled={isReadOnly}
                />
                <Label htmlFor="is_editable" className="text-sm text-muted-foreground/70">Edit</Label>
              </div>
            )}
          </div>
          <Textarea
            id="doc_extracted_text"
            name="doc_extracted_text"
            value={formData.doc_extracted_text || ""}
            onChange={handleChange}
            className={`min-h-[200px] font-mono text-sm ${!isEditable ? "bg-muted text-foreground" : ""}`}
            disabled={!isEditable}
          />
        </div>

        {!isReadOnly && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="extract_tool" className="text-muted-foreground/70">Extract Tool</Label>
              <Input
                id="extract_tool"
                name="extract_tool"
                value={formData.extract_tool || ""}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => {
                setFormData({ ...formData, is_active: checked });
                setHasChanges(true);
              }}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_active" className="text-muted-foreground/70">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_deleted"
                checked={formData.is_deleted}
                onCheckedChange={(checked) => {
                setFormData({ ...formData, is_deleted: checked });
                setHasChanges(true);
              }}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_deleted" className="text-muted-foreground/70">Deleted</Label>
            </div> 
          </div>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
} 