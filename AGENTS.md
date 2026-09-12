<!-- BEGIN:nextjs-agent-rules -->
 
# This is NOT the Next.js you know
 
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.
 
This block is written and re-added by `next dev` — verify at `apps/frontend/node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
 
<!-- END:nextjs-agent-rules -->

# Repository Instructions

## Scope

- `apps/frontend`: Next.js, React, TypeScript, next-intl, FSD.
- `apps/backend`: Express API and TypeScript.
- `apps/openApi`: OpenAPI source and Redocly validation.
- `infra/content`, `infra/database`, `infra/uploads`: runtime data; preserve content paths and names.

## Rules

- Read the nearest implementation first. Keep edits focused; preserve public APIs.
- Comment every added or changed code section so its intent is clear to people and other agents. Comments must explain behavior, invariants, and non-obvious decisions, not restate syntax.
- Never commit secrets, real `.env` files, generated build output, or runtime uploads.
- Read version-matched Next.js docs from `apps/frontend/node_modules/next/dist/docs/` before changing Next.js code.

## Skills

All repository skills live under `.agents/skills/` at the repository root. `skills-lock.json` also lives at the root.

### Required for every session

Read `.agents/skills/caveman/SKILL.md` before the first response. Apply its communication rules throughout the whole session. Use level `ultra`.

Read `.agents/skills/ponytail/SKILL.md` before the first response. Apply its coding rules throughout the whole session. Use level `ultra`.

## Mandatory ESLint workflow

The project contains two separate applications:

- `apps/frontend`
- `apps/backend`

After every code modification, run ESLint from the directory of the application you modified.

For frontend changes:
- Run `cd apps/frontend && npm run lint:fix`

For backend changes:
- Run `cd apps/backend && npm run lint:fix`

Do not run ESLint from the repository root.

After `lint:fix`:
- Review the changes made by ESLint.
- If ESLint issues remain, fix only the remaining issues manually.
- Fix ESLint errors and warnings, but never remove, rewrite, or hide `TODO` comments only to satisfy lint; report `TODO` warnings as existing lint debt unless the user explicitly asks to change them.
- Run `npm run lint:fix` again after manual fixes.
- The task is not complete until ESLint passes.

If a task modifies both applications, run `npm run lint:fix` separately in both `apps/frontend` and `apps/backend`.