import { SelectContent, SelectItem } from "./ui/select";

export default function SelectParentesco() {
  return (
    <SelectContent>
      <SelectItem value="Pai">Pai</SelectItem>
      <SelectItem value="Mãe">Mãe</SelectItem>
      <SelectItem value="Tio">Tio</SelectItem>
      <SelectItem value="Tia">Tia</SelectItem>
      <SelectItem value="Avô">Avô</SelectItem>
      <SelectItem value="Avó">Avó</SelectItem>
      <SelectItem value="Irmão">Irmão</SelectItem>
      <SelectItem value="Irmã">Irmã</SelectItem>
      <SelectItem value="Outro">Outro</SelectItem>
    </SelectContent>
  );
}
