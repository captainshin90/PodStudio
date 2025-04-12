import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SelectDialogProps {
    title: string;
    items: Array<{ id: string; title: string }>;
    onSelect: (id: string) => void;
    trigger: React.ReactNode;
  }
  
  //////////////////////////////////////////////////////////////////////
  // Select Dialog
  //////////////////////////////////////////////////////////////////////
  export default function SelectDialog({ title, items, onSelect, trigger }: SelectDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [open, setOpen] = useState(false);
  
    const filteredItems = items.filter((item) =>
      item?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
  }
  