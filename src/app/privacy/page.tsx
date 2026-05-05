import Link from "next/link";

export const metadata = { title: "Privacy — Altegra Forms" };

const CONTACT_EMAIL = "privacy@altegra.com";

export default function PrivacyPage() {
  return (
    <main className="container max-w-2xl space-y-4 py-10 text-sm">
      <h1 className="text-2xl font-semibold">Privacy information</h1>
      <p>
        Altegra Forms is operated by Altegra. This page explains what we collect
        when you submit a public form, why we collect it, how long we keep it,
        and how to exercise your data rights.
      </p>

      <h2 className="pt-4 text-lg font-medium">What we collect</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>The answers you submit on a form.</li>
        <li>
          If the form requests it: your self-reported name and email. We do not
          verify either.
        </li>
        <li>
          A one-way hash of your IP address (combined with a daily-rotating
          salt) and a truncated user-agent string. We use these only for spam
          and abuse detection. We never store your raw IP.
        </li>
      </ul>

      <h2 className="pt-4 text-lg font-medium">Why we collect it</h2>
      <p>
        To collect, route, and analyze responses on the form you submitted, and
        to keep the service free of automated abuse. Each form sets its own
        retention period, shown to you on the public form before you submit.
      </p>

      <h2 className="pt-4 text-lg font-medium">Your rights</h2>
      <p>
        You can ask the form owner to delete your response at any time. Email{" "}
        <Link className="underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </Link>{" "}
        and quote the response ID shown to you after submission. We will route
        the request to the form owner and confirm the deletion.
      </p>
      <p className="text-xs text-muted-foreground">
        Note: <code>{CONTACT_EMAIL}</code> is a placeholder — replace before
        production. See README, &ldquo;Things to update before production.&rdquo;
      </p>
    </main>
  );
}
