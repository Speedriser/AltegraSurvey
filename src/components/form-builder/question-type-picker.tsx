"use client";

import {
  AlignLeft,
  Calendar,
  CheckSquare,
  CircleDot,
  Hash,
  Star,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { QuestionType } from "@/lib/types";

const TYPES: { type: QuestionType; label: string; icon: React.ElementType }[] = [
  { type: "short_text", label: "Short text", icon: Type },
  { type: "long_text", label: "Long text", icon: AlignLeft },
  { type: "single_choice", label: "Single choice", icon: CircleDot },
  { type: "multi_choice", label: "Multiple choice", icon: CheckSquare },
  { type: "rating", label: "Rating", icon: Star },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
];

export function QuestionTypePicker({
  onAdd,
}: {
  onAdd: (type: QuestionType) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">+ Add question</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-1 gap-1">
          {TYPES.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="ghost"
              className="justify-start"
              onClick={() => onAdd(type)}
            >
              <Icon className="mr-2 h-4 w-4" /> {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
