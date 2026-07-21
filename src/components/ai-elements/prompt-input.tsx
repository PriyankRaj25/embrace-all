"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";
import { CornerDownLeftIcon, Loader2, SquareIcon, XIcon } from "lucide-react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEventHandler,
} from "react";

export type PromptInputMessage = { text: string };

type PromptInputContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

const usePromptInput = () => {
  const value = useContext(PromptInputContext);
  if (!value) throw new Error("PromptInput children must be rendered inside PromptInput");
  return value;
};

export type PromptInputProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export const PromptInput = ({ className, onSubmit, children, ...props }: PromptInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    setValue("");
    try {
      await onSubmit({ text }, event);
    } catch (error) {
      setValue(text);
      throw error;
    }
  };

  return (
    <PromptInputContext.Provider value={{ value, setValue }}>
      <form
        className={cn(
          "rounded-xl border border-input bg-card/70 p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring",
          className,
        )}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
};

export type PromptInputTextareaProps = ComponentProps<typeof Textarea>;

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ className, onKeyDown, placeholder = "Ask AetherOS to design, review, or explain an architecture…", ...props }, ref) => {
    const { value, setValue } = usePromptInput();
    const localRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => localRef.current as HTMLTextAreaElement);

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
      (event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
      },
      [onKeyDown],
    );

    return (
      <Textarea
        ref={localRef}
        className={cn(
          "max-h-52 min-h-24 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0",
          className,
        )}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
        {...props}
      />
    );
  },
);

PromptInputTextarea.displayName = "PromptInputTextarea";

export type PromptInputFooterProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
  <div className={cn("flex items-center justify-between gap-2 px-1 pt-2", className)} {...props} />
);

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export const PromptInputSubmit = ({
  className,
  status,
  onStop,
  onClick,
  disabled,
  children,
  ...props
}: PromptInputSubmitProps) => {
  const isGenerating = status === "submitted" || status === "streaming";
  const Icon =
    status === "submitted" ? Loader2 : status === "streaming" ? SquareIcon : status === "error" ? XIcon : CornerDownLeftIcon;

  return (
    <Button
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn("h-9 w-9 shrink-0", className)}
      disabled={disabled}
      onClick={(event) => {
        if (isGenerating && onStop) {
          event.preventDefault();
          onStop();
          return;
        }
        onClick?.(event);
      }}
      size="icon"
      type={isGenerating && onStop ? "button" : "submit"}
      {...props}
    >
      {children ?? <Icon className={cn("size-4", status === "submitted" && "animate-spin")} />}
    </Button>
  );
};