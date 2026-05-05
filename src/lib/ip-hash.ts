import "server-only";
import { createHash } from "node:crypto";

function utcDateStamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function dailySalt() {
  const seed = process.env.IP_HASH_SALT ?? "";
  return `${seed}:${utcDateStamp()}`;
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`${ip}:${dailySalt()}`).digest("hex");
}
