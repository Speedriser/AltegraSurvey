"use client";

import { useState, useTransition } from "react";
import { Copy, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  disablePublicToken,
  generatePublicToken,
  regeneratePublicToken,
} from "@/app/(app)/forms/actions";
import type { FormSettings } from "@/lib/types";

type Mode = "internal" | "public" | "both";

function deriveMode(settings: FormSettings, hasToken: boolean): Mode {
  if (settings.allow_anonymous && hasToken) return "both";
  if (settings.allow_anonymous) return "public";
  return "internal";
}

export function SharingPanel({
  formId,
  appUrl,
  internalSlug,
  publicToken,
  settings,
  onSettingsChange,
}: {
  formId: string;
  appUrl: string;
  internalSlug: string;
  publicToken: string | null;
  settings: FormSettings;
  onSettingsChange: (next: FormSettings) => void;
}) {
  const [pending, start] = useTransition();
  const [token, setToken] = useState(publicToken);
  const mode = deriveMode(settings, !!token);

  const internalUrl = `${appUrl}/f/${internalSlug}`;
  const publicUrl = token ? `${appUrl}/p/${token}` : null;

  function setMode(next: Mode) {
    const allow = next === "public" || next === "both";
    onSettingsChange({ ...settings, allow_anonymous: allow });
    if (allow && !token) {
      start(async () => {
        try {
          const t = await generatePublicToken(formId);
          setToken(t);
        } catch (e) {
          toast.error((e as Error).message);
        }
      });
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }

  function handleRegenerate() {
    start(async () => {
      try {
        const t = await regeneratePublicToken(formId);
        setToken(t);
        toast.success("Public link regenerated");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDisable() {
    start(async () => {
      try {
        await disablePublicToken(formId);
        setToken(null);
        onSettingsChange({ ...settings, allow_anonymous: false });
        toast.success("Public link disabled");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Sharing</Label>
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          className="mt-2"
        >
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="internal" /> Internal only (Altegra employees)
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="public" /> Public link (anyone with link)
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="both" /> Both internal and public link
          </Label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Internal link</Label>
        <div className="flex gap-2">
          <Input readOnly value={internalUrl} />
          <Button type="button" variant="outline" onClick={() => copy(internalUrl)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {settings.allow_anonymous ? (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Public link</Label>
          {publicUrl ? (
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} />
              <Button type="button" variant="outline" onClick={() => copy(publicUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generating link…
            </p>
          )}

          {publicUrl ? (
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" disabled={pending}>
                    <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate public link?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The current link will stop working immediately. Anyone
                      using it will see a 404.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerate}>
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={pending}
              >
                Disable public link
              </Button>
            </div>
          ) : null}

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anyone with this link can submit. Do not include confidential
              questions in public forms.
            </AlertDescription>
          </Alert>

          <Label className="flex items-center justify-between">
            <span className="text-sm">Ask respondents for name and email</span>
            <Switch
              checked={!!settings.collect_respondent_info}
              onCheckedChange={(v) =>
                onSettingsChange({ ...settings, collect_respondent_info: v })
              }
            />
          </Label>
        </div>
      ) : null}
    </div>
  );
}
