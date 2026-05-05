"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RETENTION_OPTIONS } from "@/lib/constants";
import type { FormSettings } from "@/lib/types";

export function PrivacyPanel({
  settings,
  onChange,
}: {
  settings: FormSettings;
  onChange: (next: FormSettings) => void;
}) {
  const isPublic = !!settings.allow_anonymous;

  return (
    <div className="space-y-4">
      <div>
        <Label>Response settings</Label>
        <div className="mt-2 space-y-3">
          <Label className="flex items-center justify-between">
            <span className="text-sm">
              One response per user (internal only)
            </span>
            <Switch
              checked={!!settings.one_response_per_user}
              disabled={isPublic && !settings.collect_respondent_info ? false : false}
              onCheckedChange={(v) =>
                onChange({ ...settings, one_response_per_user: v })
              }
            />
          </Label>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Close at (optional)
            </Label>
            <input
              type="datetime-local"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={
                settings.close_at
                  ? settings.close_at.slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...settings,
                  close_at: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
          </div>
        </div>
      </div>

      {isPublic ? (
        <div className="space-y-3 rounded-md border p-3">
          <Label className="font-medium">Privacy (required for public forms)</Label>
          <p className="text-xs text-muted-foreground">
            Per GDPR, you must inform external respondents what data you collect
            and how long you keep it. This text appears on the public form.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Privacy notice</Label>
            <Textarea
              maxLength={2000}
              value={settings.privacy_notice ?? ""}
              onChange={(e) =>
                onChange({ ...settings, privacy_notice: e.target.value })
              }
              placeholder="Explain what you collect, why, and how respondents can request deletion."
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Retention period</Label>
            <Select
              value={
                settings.retention_days === null
                  ? "indefinite"
                  : String(settings.retention_days ?? 90)
              }
              onValueChange={(v) =>
                onChange({
                  ...settings,
                  retention_days:
                    v === "indefinite"
                      ? null
                      : (Number(v) as FormSettings["retention_days"]),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.label}
                    value={opt.value === null ? "indefinite" : String(opt.value)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
