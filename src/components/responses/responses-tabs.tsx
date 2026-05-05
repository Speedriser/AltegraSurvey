"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryView } from "./summary-view";
import { ResponseTable } from "./response-table";
import { ExportTab } from "./export-tab";
import type { AnswerRow, QuestionRow, ResponseRow } from "@/lib/types";

export function ResponsesTabs({
  formId,
  formTitle,
  responses,
  answers,
  questions,
}: {
  formId: string;
  formTitle: string;
  responses: ResponseRow[];
  answers: AnswerRow[];
  questions: QuestionRow[];
}) {
  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="individual">Individual</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <SummaryView
          questions={questions}
          responses={responses}
          answers={answers}
        />
      </TabsContent>
      <TabsContent value="individual">
        <ResponseTable
          formId={formId}
          responses={responses}
          answers={answers}
          questions={questions}
        />
      </TabsContent>
      <TabsContent value="export">
        <ExportTab
          formId={formId}
          formTitle={formTitle}
          responses={responses}
          answers={answers}
          questions={questions}
        />
      </TabsContent>
    </Tabs>
  );
}
