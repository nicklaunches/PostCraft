import Image from "next/image";
import { PostCraft } from "postcraft";

export default async function Home() {
    const postcraft = new PostCraft();

    // Render template with variables
    const html = await postcraft.templates.render("welcome-email", {
        NAME: "John Doe",
        VERIFICATION_URL: "https://example.com/verify/abc123",
    });

    return (
        <div className="font-sans flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <main className="flex-1 flex flex-col gap-8 p-4 sm:p-8 md:p-12 max-w-6xl mx-auto w-full">
                <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50">PostCraft NextJS Demo</h2>
                    <p className="text-slate-600 dark:text-slate-400">Rendered email template example</p>
                </div>

                {/* Email Preview Block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Email Display */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            {/* Email Header */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-white">Welcome Email Preview</h3>
                                <p className="text-blue-100 text-sm mt-1">Template: welcome-email</p>
                            </div>

                            {/* Email Content */}
                            <div className="p-4 sm:p-6 md:p-8 max-h-96 sm:max-h-[500px] overflow-y-auto">
                                <div
                                    className="prose prose-sm sm:prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            </div>

                            {/* Email Footer */}
                            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                <p>This is a preview of the rendered email template</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Template Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Template Variables</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-blue-600 dark:text-blue-400">NAME:</span>
                                        <span className="text-slate-700 dark:text-slate-300 ml-2">John Doe</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-blue-600 dark:text-blue-400">VERIFICATION_URL:</span>
                                        <span className="text-slate-700 dark:text-slate-300 ml-2 break-all">https://example.com/verify/abc123</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Template Info</h4>
                                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <p><span className="font-medium">ID:</span> welcome-email</p>
                                    <p><span className="font-medium">Type:</span> Email</p>
                                    <p><span className="font-medium">Status:</span> <span className="text-green-600 dark:text-green-400">Active</span></p>
                                </div>
                            </div>

                            <a
                                href="https://github.com/nicklaunches/postcraft"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <a
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                        href="https://github.com/nicklaunches/postcraft"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            className="invert"
                            src="/globe.svg"
                            alt="GitHub"
                            width={20}
                            height={20}
                        />
                        View on GitHub
                    </a>
                </div>
            </main>

            <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 sm:px-8 md:px-12 py-6 sm:py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <a
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                            href="https://nicklaunches.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image aria-hidden src="/globe.svg" alt="Website icon" width={16} height={16} />
                            <span className="hidden sm:inline">nicklaunches.com</span>
                            <span className="sm:hidden">Website</span>
                        </a>
                        <a
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                            href="https://x.com/nicklaunches"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg aria-hidden className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.627l-5.1-6.657-5.848 6.657H2.081l7.775-8.886L.544 2.25h6.622l4.6 6.08L17.07 2.25h.174zm-1.106 17.92h1.829L5.016 4.078H3.08z" />
                            </svg>
                            <span className="hidden sm:inline">@nicklaunches</span>
                            <span className="sm:hidden">Twitter</span>
                        </a>
                        <a
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                            href="https://github.com/nicklaunches"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg aria-hidden className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span className="hidden sm:inline">github.com/nicklaunches</span>
                            <span className="sm:hidden">GitHub</span>
                        </a>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 text-center">
                        © 2025 PostCraft. Built with Next.js and Tailwind CSS.
                    </p>
                </div>
            </footer>
        </div>
    );
}
