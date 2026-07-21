"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

export type ConversationProps = ComponentProps<"div">;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <div
    className={cn("relative flex min-h-0 flex-1 overflow-hidden", className)}
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<"div">;

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <div className={cn("flex min-h-full flex-col gap-6 p-4", className)} {...props} />
);

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn("flex size-full flex-col items-center justify-center gap-3 p-8 text-center", className)}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </>
    )}
  </div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button> & {
  onScrollToBottom?: () => void;
};

export const ConversationScrollButton = ({
  className,
  onScrollToBottom,
  ...props
}: ConversationScrollButtonProps) => (
  <Button
    className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full", className)}
    onClick={onScrollToBottom}
    size="icon"
    type="button"
    variant="outline"
    {...props}
  >
    <ArrowDownIcon className="size-4" />
  </Button>
);