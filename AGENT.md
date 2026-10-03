# Full Project Agent Context & Requirements

This document serves as the master guide for any AI assistant or developer working on the `project-notes` application. It covers both the frontend (currently implemented) and the backend (to be implemented), ensuring full-stack cohesion.

## 1. Project Overview
`project-notes` is a rich personal note-taking application. It bridges the gap between structured hierarchical document tools (like Notion) and freeform spatial tools (like Miro). A single note can be viewed in traditional structured layouts (Grid, Masonry) or dragged freely around an infinite canvas (Whiteboard mode).

---

## 2. Frontend Architecture & Implementation

### Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS + Custom CSS Variables (`globals.css`) for theming.
*   **Animations:** Framer Motion (heavily used for layout transitions).
*   **Headless UI:** `@base-ui/react` (used for accessible Dropdowns/Popovers).
*   **Icons:** `lucide-react` (e.g., `<Circle />` for subnotes).

### Core Data Structures
The frontend operates on the `NoteItem` interface (defined in `features/home/types.ts`):
```typescript
export interface NoteFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  color?: string;
  textColor?: string;
  category?: string;
  subNotes?: NoteItem[];
  files?: NoteFile[];
}
```

### Key UI Behaviors & Quirks
*   **Framer Motion `layoutId` Animations:** When a user clicks a Note card in a Grid or Masonry view, Framer Motion's `layoutId` seamlessly scales the card into a full-screen Modal. 
*   **Whiteboard Canvas:** The infinite canvas implements custom pan and zoom physics. 
    *   *Critical Note:* Framer Motion's layout animations conflict with manual drag physics. The `Note.tsx` component accepts a `disableLayoutAnimation` prop, which the `Whiteboard` conditionally flips to `true` *only* while panning or dragging, restoring the modal pop-out animation immediately after dragging ends.
*   **Sidebar Navigation:** The left sidebar maps the hierarchical tree of notes using `parentId` to nest subnotes. Subnotes use a `lucide-react` `<Circle />` icon indicator.
*   **Local State:** Whiteboard card positions (`project_notes_card_positions`) and canvas color (`project_notes_canvas_color`) are currently stored in `localStorage`.

---

## 3. Backend Architecture & Requirements

The backend is intended to be a separate service. When building it, adhere strictly to these requirements to satisfy the frontend's expectations.

### Tech Stack
*   **Environment:** Node.js, Express
*   **Database:** PostgreSQL (hosted on Neon)
*   **ORM:** Prisma

### Authentication & Security
*   **Providers:** Email/Password and Google OAuth.
*   **Ownership:** Every `Note` belongs to a `User`. The backend must strictly verify `ownerId` derived from the session/token on every operation.

### Data Model & Relationships
*   **Note Entity:** Must mirror the `NoteItem` interface above (`id`, `title`, `content`, `color`, `textColor`, `category`, `parentId`, `ownerId`). Needs a self-referencing relation for `parentId`.
*   **FileAttachment Entity:** Stores file attachments belonging to a Note (`id`, `name`, `size`, `type`, `url`, `noteId`). Cascades delete on Note deletion.
*   **UserPreference Entity:** Must store the Whiteboard state currently held in localStorage. Needs to store `canvasColor` (string) and `positions` (JSONB mapping of `{ x, y }` coordinates keyed by Note ID).

### Expected API Endpoints (REST)
*   **`GET /api/notes`**: Fetch user notes. Must return `subNotes` and `files` nested inside their parents.
*   **`POST /api/notes`**: Create a note (Root or Subnote).
*   **`PATCH /api/notes/:id`**: Update note content/metadata (including `textColor` and `files`). Must support debounced autosaving from the frontend editor.
*   **`DELETE /api/notes/:id`**: Delete a note. Must cascade to delete all associated subnotes and attachments.
*   **`GET /api/preferences/whiteboard`**: Fetch whiteboard `{ canvasColor, positions }`.
*   **`PATCH /api/preferences/whiteboard`**: Update whiteboard settings (fired periodically when dragging cards).

---

## 4. Development Rules & Guidelines
1.  **Strict TypeScript:** No `any` types. Define exact shapes.
2.  **Preserve UI Integrity:** Never modify `layoutId` animations, drag physics, or component nesting logic without explicit permission. These are highly tuned.
3.  **Performant State:** The frontend uses Optimistic UI. Backend updates should be asynchronous and not block the user from continuing to type or drag.
4.  **No Websockets:** Standard REST is sufficient for personal autosave. Do not introduce Websockets or CRDTs unless real-time collaborative editing is explicitly requested.
