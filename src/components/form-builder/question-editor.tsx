"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionDraft } from "@/lib/validations";

const TYPE_LABEL: Record<QuestionDraft["type"], string> = {
  short_text: "Short text",
  long_text: "Long text",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  rating: "Rating",
  number: "Number",
  date: "Date",
};

export function QuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: QuestionDraft & { _key: string };
  onChange: (next: QuestionDraft & { _key: string }) => void;
  onRemove: () => void;
}) {
  const sortable = useSortable({ id: question._key });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const update = (patch: Partial<QuestionDraft>) =>
    onChange({ ...question, ...patch });

  const choices = question.options?.choices ?? [];
  const addChoice = () =>
    update({
      options: {
        ...(question.options ?? {}),
        choices: [...choices, { id: nanoid(8), label: "" }],
      },
    });
  const updateChoice = (id: string, label: string) =>
    update({
      options: {
        ...(question.options ?? {}),
        choices: choices.map((c) => (c.id === id ? { ...c, label } : c)),
      },
    });
  const removeChoice = (id: string) =>
    update({
      options: {
        ...(question.options ?? {}),
        choices: choices.filter((c) => c.id !== id),
      },
    });

  const isChoice =
    question.type === "single_choice" || question.type === "multi_choice";
  const isRating = question.type === "rating";

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="cursor-grab text-muted-foreground"
            aria-label="Drag handle"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{TYPE_LABEL[question.type]}</Badge>
              <div className="flex items-center gap-3">
                <Label className="flex items-center gap-2 text-xs">
                  Required
                  <Switch
                    checked={question.required}
                    onCheckedChange={(v) => update({ required: v })}
                  />
                </Label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onRemove}
                  aria-label="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input
              placeholder="Question label"
              value={question.label}
              onChange={(e) => update({ label: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={question.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              className="min-h-[60px]"
            />

            {isChoice ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Options</Label>
                {choices.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Input
                      value={c.label}
                      placeholder="Option"
                      onChange={(e) => updateChoice(c.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChoice(c.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add option
                </Button>
              </div>
            ) : null}

            {isRating ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Min: {question.options?.min ?? 1}</Label>
                  <Slider
                    min={1}
                    max={9}
                    step={1}
                    value={[question.options?.min ?? 1]}
                    onValueChange={([v]) =>
                      update({
                        options: { ...(question.options ?? {}), min: v },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max: {question.options?.max ?? 5}</Label>
                  <Slider
                    min={2}
                    max={10}
                    step={1}
                    value={[question.options?.max ?? 5]}
                    onValueChange={([v]) =>
                      update({
                        options: { ...(question.options ?? {}), max: v },
                      })
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
