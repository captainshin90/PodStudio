import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccessControlDialogProps {
  isOpen: boolean;
  onAccessGranted: () => void;
}

//////////////////////////////////////////////////////////////////////////////
// This is the main component for the access control dialog
//////////////////////////////////////////////////////////////////////////////  
export function AccessControlDialog({ isOpen, onAccessGranted }: AccessControlDialogProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if access is already granted
  useEffect(() => {
    const savedKey = sessionStorage.getItem("secret_key");
    if (savedKey) {
      onAccessGranted();
    }
  }, [onAccessGranted]);

  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for the access control dialog
  //////////////////////////////////////////////////////////////////////////////  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Submitting access code:", accessCode);
      
      // Check if the access code matches the SECRET_KEY
      const response = await fetch("/api/verify-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Access verification response:", data);

      if (response.ok && data.success) {
        console.log("Access granted");
        // Save the access code to session storage
        sessionStorage.setItem("secret_key", accessCode);
        toast({
          title: "Access Granted",
          description: "You have successfully accessed the application.",
        });
        onAccessGranted();
      } else {
        console.log("Access denied, showing toast");
        // Show error message from server or default message
        toast({
          title: "Access Denied",
          description: data.message || "The access code you entered is incorrect.",
        });
        // Clear the input field for better UX
        setAccessCode("");
      }
    } catch (error) {
      console.error("Error verifying access:", error);
      toast({
        title: "Error",
        description: "An error occurred while verifying your access code.",
      });
      // Clear the input field for better UX
      setAccessCode("");
    }

    setIsLoading(false);
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for the access control dialog
  //////////////////////////////////////////////////////////////////////////////    
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Access Control</DialogTitle>
          <DialogDescription>
            Please enter the access code to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 