import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Templates - PostCraft Studio",
  description: "Manage your email templates",
};

export default function TemplatesPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <Link href="/templates/new">
          <Button variant="primary">Create New Template</Button>
        </Link>
      </div>

      {/* Empty state - will be replaced with actual data */}
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No templates yet
        </h2>
        <p className="text-gray-600 mb-6">
          Create your first email template to get started
        </p>
        <Link href="/templates/new">
          <Button variant="primary" size="lg">
            Create Template
          </Button>
        </Link>
      </div>
    </div>
  );
}
