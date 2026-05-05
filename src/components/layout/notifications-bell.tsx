"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markAllNotificationsRead } from "@/app/(app)/notifications/actions";

type Item = {
  id: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

export function NotificationsBell({ items }: { items: Item[] }) {
  const unread = items.filter((i) => !i.read_at).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]"
            >
              {unread}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" size="sm" variant="ghost">
                Mark all read
              </Button>
            </form>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {items.slice(0, 10).map((i) => (
              <li
                key={i.id}
                className="rounded-md border bg-card p-2 text-xs"
              >
                <p>{i.message}</p>
                <p className="mt-1 text-muted-foreground">
                  {new Date(i.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
