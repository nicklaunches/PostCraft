# PostCraft

**Component Email Studio for Developers** #

# Overview A self-hosted (or cloud) Next.js studio for designing, versioning, and visual drag-and-drop builder by react-email-editor. Plug in your own ESP (starting with Amazon SES). Built-in AI assistant (bring your own API keys) to draft subject lines, copy, and entire sequences.

UI Kit: TailwindCSS + shadcn components

## Features

- **react-email-editor** — visual drag-and-drop email builder to build templates.
- **Drop-in local studio** — Install the package and launch localhost:3579 to mange templates, set props, and copy the import snippet for use in your codebase.
- **Pluggable ESPs** — Connect yout AWS SES. Roadmap: Extend beyond SES (Mailgun, Postmark, etc.) via adapters.
- **AI Assistant** — Generate subject lines, copy, layouts, and multi-step campaigns; refactor tone and length.
- **Client-compat testing** — Preview outputs aligned with React Email's components tested on Gmail, Outlook, Apple Mail, and more.
- **Campaigns** — Create/schedule broadcasts, basic segmentation, A/B subject tests, unsub handling, and simple analytics.
- **Self-host** — Run it inside your stack for privacy/compliance.