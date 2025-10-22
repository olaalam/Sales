"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditDialog({
  open,
  onOpenChange,
  selectedRow,
  children,
  onSave,
  isLoading = false,
}) {
  if (!selectedRow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white !p-6 rounded-lg shadow-lg max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-bg-primary">
            Edit
          </DialogTitle>
        </DialogHeader>
        <div className="!space-y-6">{children}</div>
        <DialogFooter className="!pt-6">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border border-bg-primary cursor-pointer !p-4 text-bg-primary rounded-md !mr-4"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading}
            onClick={onSave}
            className="bg-bg-primary cursor-pointer !p-4 text-white rounded-md"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}