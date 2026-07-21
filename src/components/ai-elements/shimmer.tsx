"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ShimmerProps = ComponentProps<"span">;

export const Shimmer = ({ className, ...props }: ShimmerProps) => (
  <span
    className={cn(
      "inline-flex animate-pulse bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent",
      className,
    )}
    {...props}
  />
);