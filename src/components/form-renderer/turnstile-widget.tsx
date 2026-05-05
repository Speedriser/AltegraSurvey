"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void },
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    function tryRender() {
      if (!sitekey || !ref.current || widgetIdRef.current) return;
      if (!window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey,
        callback: (token) => onToken(token),
      });
    }
    tryRender();
    const id = window.setInterval(tryRender, 200);
    return () => window.clearInterval(id);
  }, [sitekey, onToken]);

  if (!sitekey) {
    return (
      <p className="text-xs text-destructive">
        Bot protection is not configured.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={ref} />
    </>
  );
}
