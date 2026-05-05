"use client";

// Hidden from real users via aria/autocomplete; bots fill it.
// The form submits its value as `honeypot` and the API rejects non-empty values.
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
    >
      <label>
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
