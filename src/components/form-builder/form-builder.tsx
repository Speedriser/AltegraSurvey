"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { QuestionTypePicker } from "./question-type-picker";
import {
  SortableQuestionList,
  type KeyedQuestion,
} from "./sortable-question-list";
import { SharingPanel } from "./sharing-panel";
import { PrivacyPanel } from "./privacy-panel";
import {
  closeForm,
  publishForm,
  saveQuestions,
  unpublishForm,
  updateFormDetails,
  updateFormSettings,
} from "@/app/(app)/forms/actions";
import type {
  FormRow,
  FormSettings,
  QuestionRow,
  QuestionType,
} from "@/lib/types";

type Props = {
  form: FormRow;
  questions: QuestionRow[];
  appUrl: string;
};

function questionFromRow(q: QuestionRow): KeyedQuestion {
  return {
    _key: q.id,
    id: q.id,
    type: q.type,
    label: q.label,
    description: q.description ?? "",
    position: q.position,
    required: q.required,
    options: q.options ?? null,
  };
}

function newQuestion(type: QuestionType, position: number): KeyedQuestion {
  const base: KeyedQuestion = {
    _key: nanoid(8),
    type,
    label: "",
    description: "",
    position,
    required: false,
    options: null,
  };
  if (type === "single_choice" || type === "multi_choice") {
    base.options = {
      choices: [
        { id: nanoid(8), label: "Option 1" },
        { id: nanoid(8), label: "Option 2" },
      ],
    };
  } else if (type === "rating") {
    base.options = { min: 1, max: 5 };
  }
  return base;
}

export function FormBuilder({ form, questions, appUrl }: Props) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [items, setItems] = useState<KeyedQuestion[]>(
    questions.map(questionFromRow),
  );
  const [settings, setSettings] = useState<FormSettings>(form.settings);
  const [savingDetails, startDetails] = useTransition();
  const [savingQuestions, startQuestions] = useTransition();
  const [statusPending, startStatus] = useTransition();

  function persistDetails() {
    startDetails(async () => {
      try {
        await updateFormDetails(form.id, {
          title: title.trim() || "Untitled form",
          description: description.trim() || null,
        });
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function persistQuestions(next: KeyedQuestion[]) {
    setItems(next);
    startQuestions(async () => {
      try {
        await saveQuestions(form.id, next.map((q, i) => ({ ...q, position: i })));
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function persistSettings(next: FormSettings) {
    setSettings(next);
    startStatus(async () => {
      try {
        await updateFormSettings(form.id, next);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleAdd(type: QuestionType) {
    persistQuestions([...items, newQuestion(type, items.length)]);
  }

  function handleStatus(action: "publish" | "unpublish" | "close") {
    startStatus(async () => {
      try {
        if (action === "publish") await publishForm(form.id);
        if (action === "unpublish") await unpublishForm(form.id);
        if (action === "close") await closeForm(form.id);
        toast.success(`Form ${action}ed`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <Input
            className="text-lg font-semibold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={persistDetails}
            placeholder="Form title"
          />
          <Badge variant={form.status === "published" ? "default" : "secondary"}>
            {form.status}
          </Badge>
          {savingDetails || savingQuestions ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Save className="h-3 w-3" /> Saving…
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/forms/${form.id}/preview`} target="_blank">
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Link>
          </Button>
          {form.status === "draft" || form.status === "closed" ? (
            <Button
              onClick={() => handleStatus("publish")}
              disabled={statusPending}
            >
              Publish
            </Button>
          ) : null}
          {form.status === "published" ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatus("unpublish")}
                disabled={statusPending}
              >
                Unpublish
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatus("close")}
                disabled={statusPending}
              >
                Close
              </Button>
            </>
          ) : null}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Settings</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Form settings</DialogTitle>
                <DialogDescription>
                  Sharing, response, and privacy settings for this form.
                </DialogDescription>
              </DialogHeader>
              <SharingPanel
                formId={form.id}
                appUrl={appUrl}
                internalSlug={form.slug}
                publicToken={form.public_token}
                settings={settings}
                onSettingsChange={persistSettings}
              />
              <Separator />
              <PrivacyPanel settings={settings} onChange={persistSettings} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={persistDetails}
        placeholder="Form description (optional)"
      />

      <SortableQuestionList questions={items} onChange={persistQuestions} />

      <div>
        <QuestionTypePicker onAdd={handleAdd} />
      </div>
    </div>
  );
}
