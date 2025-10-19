"use client";

import { cn } from "@/lib/utils/cn";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning";
}

const Toast = ({ className, variant = "default", ...props }: ToastProps) => {
  const variants = {
    default: "bg-white border-gray-300 text-gray-900",
    success: "bg-green-50 border-green-300 text-green-900",
    error: "bg-red-50 border-red-300 text-red-900",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-900",
  };

  return (
    <div
      className={cn(
        "rounded-md border p-4 shadow-lg",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const ToastTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold", className)} {...props} />
);

const ToastDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={cn("text-sm", className)} {...props} />
);

export { Toast, ToastTitle, ToastDescription };
