"use client";

import { cn } from "@/lib/utils/cn";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

const Alert = ({ className, variant = "default", ...props }: AlertProps) => {
  const variants = {
    default: "border border-gray-300 bg-white text-gray-900",
    destructive:
      "border border-red-300 bg-red-50 text-red-900",
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("mb-1 font-medium leading-tight", className)} {...props} />
);

const AlertDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
);

export { Alert, AlertTitle, AlertDescription };
