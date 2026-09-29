import { ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
  ariaLabel?: string;
  destructive?: boolean;
  children: ReactNode;
}

export default function ConfirmButton({
  title, description, confirmLabel = "Confirmar", onConfirm, className, ariaLabel, destructive, children,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className={className} aria-label={ariaLabel}>{children}</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
