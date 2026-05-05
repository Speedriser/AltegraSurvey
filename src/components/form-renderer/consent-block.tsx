"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ConsentBlock({
  notice,
  retentionDays,
  consent,
  onConsentChange,
}: {
  notice: string | null;
  retentionDays: number | null;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        How your data is used
      </button>
      {open ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="whitespace-pre-line">{notice ?? ""}</p>
          <p>
            <strong>Retention:</strong>{" "}
            {retentionDays ? `${retentionDays} days` : "Indefinite (until removed by request)"}
          </p>
          <p>
            <strong>Data controller:</strong> Altegra. See our{" "}
            <Link href="/privacy" target="_blank" className="underline">
              privacy info
            </Link>
            .
          </p>
        </div>
      ) : null}
      <Label className="flex items-start gap-2 text-sm font-normal">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => onConsentChange(v === true)}
        />
        <span>I have read and agree to how my data will be used.</span>
      </Label>
    </div>
  );
}
