// components/CheckoutSucessoDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  nomeCrianca: string | any
}

export function CheckoutSucessoDialog({ open, onOpenChange, nomeCrianca }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-out realizado com sucesso!</DialogTitle>
        </DialogHeader>
        <p>{nomeCrianca} saiu da sala. Até a próxima!</p>
      </DialogContent>
    </Dialog>
  )
}
