import { createForm } from "@/app/(app)/forms/actions";

export default async function NewFormPage() {
  await createForm();
  return null;
}
