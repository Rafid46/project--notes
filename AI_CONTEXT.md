# Notes App — AI Project Context

This file is a handoff for coding assistants working on this project. Read the repository's existing `AGENTS.md`, `README.md`, package files, Prisma schema, migrations, and source code before editing. The repository is the source of truth for what is already implemented. This document describes the product requirements and intended architecture discussed with the owner; it is **not** a claim that these features exist yet.

## Product goal

Build a personal notes website with quick, reliable editing; nested pages and subnotes; multiple ways to view the same notes; rich content and attachments; search that locates a note; and a drawing whiteboard. Treat it as a production product even if the first user base is small.

## Confirmed requirements

- Users can sign up and sign in using **email/password or Google**. There are no other requested sign-in providers.
- A note can contain text, design images, and other supported file attachments. A note can have subnotes, which can also contain text and images. Example: a `Designs` note with `Website Design` and `Logo Design` subnotes.
- Pages, subpages, and note cards form a hierarchy. A child note belongs under a parent note; a root note has no parent. Avoid separate copies of the same content for each level or view.
- Notes can be displayed in **masonry**, **list**, **uniform grid**, and **whiteboard** modes. These are views of the same underlying notes. Switching modes must not duplicate or edit note content.
- In whiteboard mode, users can position their note cards freely. The user also wants genuine whiteboard tools like Excalidraw/Miro: selection, pen, eraser, shapes, arrows, text, images, pan/zoom, and undo/redo. A node/flow diagram library alone does not satisfy this requirement.
- The left sidebar should navigate the page/subpage hierarchy and feel immersive. Preserve usable keyboard navigation and clear location within the tree.
- Note headers can use multiple fonts and colors.
- Search should navigate to the matching note and visually spotlight it by dimming the surrounding interface. The spotlight effect is frontend behavior; the backend returns a matching note ID, context, and parent path.

## Stack and repository context

- Requested backend: **Node.js, Express, Prisma, PostgreSQL on Neon**.
- The owner said `DATABASE_URL` and `NODE_ENV` already exist in their backend `.env`. Never print, commit, or replace their secret values.
- A previous file-tree example showed `prisma/schema.prisma`, `prisma/migrations`, `prisma.config.ts`, `src/config`, `src/controllers`, `src/routes`, `src/server.js`, and an `AGENTS.md`. This was a description of the owner's Windows project, **not a repository inspected in this environment**. Confirm the actual structure and installed Prisma version before editing. Preserve existing migrations and unrelated code.
- The frontend framework and current implementation have not been inspected. React has been used in examples, but confirm the actual framework, router, editor, and state/query libraries from the repository.
- No existing project ZIP, repository path, or working source tree was supplied in this conversation. A separate unfinished scratch scaffold was started and stopped; do not treat it as the owner's project.

## Data model intent

- `User` owns `Note` records. `Note.ownerId` must be derived from the authenticated session, never trusted from a client request.
- `Note.parentId` points to another note, or is null for a root note. A note may be both content and a parent of other notes. Moving a note must prevent cycles and cross-user parenting.
- Store note content once. Grid, list, masonry, and whiteboard read the same note records.
- Store whiteboard position/size/z-order separately from note body. Scope placement to the relevant page/board if multiple boards are supported. Keep drawing-scene data separate from canonical note content.
- Use stable internal user IDs for note ownership. For Google identity, use the verified ID token's `sub` as the unique Google account identifier; email is profile/contact data, not the provider identity key.
- Keep attachment metadata and note relationships in PostgreSQL. Store file bytes in suitable object storage, with server-side ownership checks, limits, safe download/preview handling, and a defined upload lifecycle. Do not claim that literally every file type can be safely previewed.
- A nested JSON API response may contain `subNotes` for UI convenience, but database rows should normally be linked by IDs instead of duplicating nested content.

## Authentication intent

- Email/password accounts and Google accounts map to the same internal `User` model and use the same application session mechanism.
- Hash passwords; never store plaintext passwords. Plan email verification, password reset, session expiry/revocation, and login rate limits before public release.
- Google sign-in uses a Web OAuth client ID on the frontend and server. The backend verifies the received Google ID token against the configured client ID before looking up or creating a user.
- If a password account already uses the Google account's email, do not silently link the accounts solely by matching email. Link after the user proves access to the existing account.
- Add any required Google client ID, frontend origin, cookie, email, and storage settings to `.env.example`. Keep actual secrets outside version control.

## Editing and sync behavior

1. Render every keystroke immediately from local editor state. A GET request is for initial data or refresh, not for repainting after each character.
2. Persist a recoverable local draft so a refresh before server autosave can restore recent edits. Choose a browser storage approach suitable for actual note size; handle quota/write failures. A local draft and a server-confirmed save are distinct states.
3. Send autosaves after a short pause (roughly 500–1000 ms is a starting point, not a requirement). A cursor click without a content change should not save.
4. Keep at most one save request in flight per note. If the user edits during that request, send the latest content afterward.
5. Use an atomic version check to avoid silent overwrites from another tab/device. Return a conflict response and preserve the unsaved draft for resolution.
6. Make note creation safe to retry, for example with a client-generated ID or idempotency key. Never display `Saved` until the server confirms the specific latest content.
7. REST is sufficient for personal autosave. Do not add WebSockets/CRDTs unless real-time multi-user coediting becomes an explicit requirement.

## Whiteboard decision and open integration risk

The owner wants Excalidraw/Miro-style drawing tools and asked for a free package. **Excalidraw's embeddable React component** is the current candidate for a complete drawing toolbar. Confirm its current license and installed API before integrating. React Flow alone covers draggable nodes and navigation but not the requested pen/eraser drawing experience.

The hard part is linking real, editable note cards with the drawing scene. Excalidraw scene elements do not automatically become arbitrary rich React note components. Decide deliberately whether the canvas shows note previews that open the canonical editor, or whether a custom canvas implementation is justified for editing full cards in place. Do not flatten note content into an image without preserving a route to the actual note. Save drawings, referenced note IDs, and note placements with a clear ownership and persistence model.

## Search and performance

- Search titles and extractable text, scoped to the current user; return a note ID, excerpt, and ancestor path. The UI expands ancestors, navigates, scrolls to the note, and dims the surroundings with an accessible spotlight interaction.
- Keep note-list/card payloads lightweight. Load full rich content and attachment details when opening a note. Paginate large collections and avoid rendering an entire large tree or whiteboard unnecessarily.
- Save positions at drag end or in bounded batches, rather than sending an API request for every pointer movement.
- Establish size limits for text, rich content, uploads, and drawing scenes, and enforce them on both client and server.

## Working rules for the next AI assistant

1. Inspect the real project and `AGENTS.md` first. Summarize what exists versus what remains before making major changes.
2. Preserve the owner's architecture and existing migrations. Do not replace their repository with a fresh scaffold.
3. Resolve implementation details from installed package versions and official documentation. Avoid assuming Prisma configuration from a different major version.
4. Protect every note, subnote, search result, attachment, whiteboard scene, and placement by authenticated ownership checks.
5. Implement one vertical slice at a time and test meaningful risks: hierarchy/cycles, ownership isolation, autosave conflicts, recovery, and whiteboard persistence.
6. State any external service configuration that is still needed. Never mark a stubbed file upload or login flow as complete.
7. Ask the owner for a decision only when the actual repository and requirements cannot resolve it; make other routine implementation choices independently.

## Current status at handoff

The owner's source repository has **not** been provided to this assistant. No changes to the owner's existing project have been verified. Treat this document as requirements/context, not implementation documentation. Update it after inspecting the real codebase and after each major design decision.
