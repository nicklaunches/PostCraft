'use client';

interface TemplateErrorProps {
    error: Error;
}

export function TemplateError({ error }: TemplateErrorProps) {
    const handleRefresh = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.reload();
    };

    const errorMessage = error.message || 'An unknown error occurred';
    const isTemplateNotFound = error.constructor.name === 'TemplateNotFoundError';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Error Display */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-red-200 dark:border-red-800">
                    {/* Error Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 sm:px-6 py-4 sm:py-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-white">Template Error</h3>
                        <p className="text-red-100 text-sm mt-1">{errorMessage}</p>
                    </div>

                    {/* Error Content */}
                    <div className="p-4 sm:p-6 md:p-8 space-y-6">
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Error Details:</h4>
                                <p className="text-red-800 dark:text-red-200 text-sm mb-4">
                                    <span className="font-semibold">Type:</span> {error.constructor.name}
                                </p>
                            </div>

                            {isTemplateNotFound && (
                            <div>
                                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Setup Instructions:</h4>
                                <ol className="list-decimal list-inside space-y-2 text-red-800 dark:text-red-200 text-sm">
                                    <li>Open a terminal and run:
                                        <code className="block bg-red-100 dark:bg-red-900 p-2 rounded mt-1 font-mono text-xs">npm run postcraft</code>
                                    </li>
                                    <li>Visit <a href="http://localhost:3579" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">localhost:3579</a> in your browser</li>
                                    <li>Click "Create New Template"</li>
                                    <li>Name the template: <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded font-mono text-xs">welcome-email</code></li>
                                    <li>Add the following merge tags to your template:
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded font-mono text-xs">{"{{NAME}}"}</code></li>
                                            <li><code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded font-mono text-xs">{"{{VERIFICATION_URL}}"}</code></li>
                                        </ul>
                                    </li>
                                    <li>Save the template</li>
                                    <li>Refresh this page</li>
                                </ol>
                            </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleRefresh}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
