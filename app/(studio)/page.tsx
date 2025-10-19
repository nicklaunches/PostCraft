import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StudioHome() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to PostCraft Studio
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Design beautiful email templates with our visual editor
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/templates" className="block">
            <Button variant="default" size="lg" className="w-full">
              Browse Templates
            </Button>
          </Link>
          <Link href="/templates/new" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              Create New Template
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Start
          </h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">1.</span>
              <span>Navigate to Templates to view all your email templates</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">2.</span>
              <span>Create a new template or edit existing ones</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">3.</span>
              <span>Use the SDK to render templates with variable substitution</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
