"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { QuestionEditor } from "./question-editor";
import type { QuestionDraft } from "@/lib/validations";

export type KeyedQuestion = QuestionDraft & { _key: string };

export function SortableQuestionList({
  questions,
  onChange,
}: {
  questions: KeyedQuestion[];
  onChange: (next: KeyedQuestion[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q._key === active.id);
    const newIndex = questions.findIndex((q) => q._key === over.id);
    onChange(
      arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
        ...q,
        position: i,
      })),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleEnd}
    >
      <SortableContext
        items={questions.map((q) => q._key)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionEditor
              key={q._key}
              question={q}
              onChange={(next) =>
                onChange(questions.map((p) => (p._key === q._key ? next : p)))
              }
              onRemove={() =>
                onChange(
                  questions
                    .filter((p) => p._key !== q._key)
                    .map((p, i) => ({ ...p, position: i })),
                )
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
