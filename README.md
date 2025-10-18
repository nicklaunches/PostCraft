# PostCraft

**Email Studio for Developers** #

UI Kit: TailwindCSS + shadcn components

## Features

- **react-email-editor** — visual drag-and-drop email builder to build templates.
- **Drop-in local studio** — Install the package and launch localhost:3579 to mange templates, set props, and copy the import snippet for use in your codebase.
- **Pluggable ESPs** — AWS SES supported. Roadmap: Extend beyond SES (Mailgun, Postmark, etc.) via adapters.
- **AI Assistant** — Generate subject lines, copy, layouts, and multi-step campaigns; refactor tone and length.
- **Campaigns** — Create/schedule broadcasts, basic segmentation, A/B subject tests, unsub handling, and simple analytics.
- **Self-host** — Run it inside your stack for privacy/compliance.

## Usage example in your codebase

```
import { PostCraft } from 'PostCraft';

const PostCraft = new PostCraft();

await PostCraft.templates.create({
  name: 'welcome-email',
  html: '<strong>Hey, {{{NAME}}}, you are {{{AGE}}} years old.</strong>',
  variables: [
    {
      key: 'NAME',
      type: 'string',
      fallbackValue: 'user',
    },
    {
      key: 'AGE',
      type: 'number',
      fallbackValue: 25,
    },
    {
      key: 'OPTIONAL_VARIABLE',
      type: 'string',
    },
  ],
});
```