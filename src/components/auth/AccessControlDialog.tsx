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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if the access code matches the VITE_SECRET_KEY
      const response = await fetch("/api/verify-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      });

      if (response.ok) {
        // Save the access code to session storage
        sessionStorage.setItem("secret_key", accessCode);
        toast({
          title: "Access Granted",
          description: "You have successfully accessed the application.",
        });
        onAccessGranted();
      } else {
        toast({
          title: "Access Denied",
          description: "The access code you entered is incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying access:", error);
      toast({
        title: "Error",
        description: "An error occurred while verifying your access code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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