import { Suspense } from "react";
import { TemplateList } from "@/components/template-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Templates - PostCraft Studio",
  description: "Manage your email templates",
};

interface TemplatesPageProps {
  searchParams: { page?: string; pageSize?: string };
}

export default async function TemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const page = searchParams.page || "1";
  const pageSize = searchParams.pageSize || "20";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your email templates
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        }
      >
        <TemplateList page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
