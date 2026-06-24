"use client";
import { useParams } from "next/navigation";
import { ModelDetail } from "@mw/ui/ModelDetail";

export default function ModelPage() {
  const params = useParams<{ id: string }>();
  return <ModelDetail id={Number(params.id)} />;
}
