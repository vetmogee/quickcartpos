import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void; // Make onConfirm potentially async
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Add loading state for the confirm button
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Potvrdit",
  cancelText = "Zrušit",
  isConfirming = false, // Default to false
}: ConfirmationDialogProps) {

  const handleConfirm = async () => {
     await onConfirm();
     // Parent component should handle closing the dialog on success/failure
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelText}</AlertDialogCancel>
          <Button onClick={handleConfirm} variant="destructive" disabled={isConfirming}>
             {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
             {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 