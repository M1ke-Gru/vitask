# Spaces (Category) UI Specification

This document defines the **final, agreed-upon UI and behavior** for Spaces (formerly “categories”) in the task manager.
Spaces are a **core abstraction**, not metadata.

---

## 1. Core Concept

### Spaces

- A **Space** represents a contextual work area.
- Every task belongs to **exactly one Space**.
- Spaces are:
  - Mutually exclusive
  - Entered deliberately
  - Not combinable like tags

### Inbox

- Inbox is **not special in code**.
- It is simply a Space with `isDefault = true`.
- Inbox can be:
  - Renamed
  - Unset as default
  - Deleted

---

## 2. Global UI State

There is exactly **one active UI context** at any time:

```
activeContext: "overview" | spaceId
```

Rules:

- No split views
- No multiple active Spaces
- No nested navigation

---

## 3. Overview (Default Desktop State)

### Purpose

- Situational awareness
- Lightweight task capture
- Zero deep work

### Overview Contains

- A grid or list of **Space cards**
- One card per Space
- One additional **Add Space card**

---

## 4. Space Card Structure

Each Space card consists of three vertical sections.

---

### 4.1 Header (Context-level actions)

- Space name
- Optional task count
- **Focus icon (⤢)** → enter the Space
- **Options menu (⋮)**:
  - Rename Space
  - Set / unset default
  - Archive / delete (future)

Rules:

- Header actions affect the Space as a whole
- The entire card is **not clickable**

---

### 4.2 Task Preview (Read-only)

- Shows **3–5 tasks max**
- Tasks are:
  - Read-only
  - No checkboxes
  - No inline editing
  - No drag & drop

- No scrolling inside cards

Purpose:

- Fast scanning
- Equal visual weight across Spaces

---

### 4.3 Footer (Scoped action)

```
+ Add task
```

Behavior:

- Adds a task **directly to that Space**
- Inline input appears at the bottom
- Enter → task created
- Input closes immediately

Rules:

- Does **not** focus the Space
- Does **not** expand the list

---

## 5. Add Space Card

### Purpose

- Create new Spaces inline
- Preserve visual consistency

### Behavior

- Appears as a card with similar dimensions
- Visually muted
- Placed **last** in the card list

Interaction:

- Click → inline input or lightweight modal
- Create → replaced by the new Space card
- **Do NOT auto-focus** the new Space

---

## 6. Focusing a Space

### Entering a Space

Triggered by:

- Clicking the focus icon (⤢)
- Keyboard shortcut

Effect:

```
activeContext = spaceId
```

### Focused Space View

- Full task list
- Task input at top
- No Overview content visible
- Clear “Back to Overview” affordance

Tabs:

- May appear **only after a Space is focused**
- Tabs are contextual, not permanent UI chrome

---

## 7. Global “Add Task” Behavior

### Global Add Task Button

- Visible in Overview header
- Always accessible
- Keyboard shortcut supported

### Default Space Rules (Strict)

1. If a **default Space exists**
   → Task is created there automatically

2. If **no default Space exists**
   → User must select a Space explicitly

3. If **exactly one Space exists**
   → Auto-select it

No heuristics. No guessing.

---

## 8. Default Space

### Rules

- At most **one** Space can be default
- Default is **explicit only**
- Default never changes automatically

### UI

- Set / unset via Space options (⋮)
- Subtle visual indicator (icon / tooltip)
- No loud badges

### Effects

- Receives global task creation
- Renaming does not remove default role
- Deleting removes default entirely

---

## 9. Action Placement Rules (Non-negotiable)

| Action                    | Location           |
| ------------------------- | ------------------ |
| Add task (global)         | Overview header    |
| Add task (specific Space) | Space card footer  |
| Add Space                 | Add Space card     |
| Rename / delete Space     | Space card options |
| Focus Space               | Space card header  |

No mixing of scopes.

---

## 10. Keyboard & Power-User Support

Minimum shortcuts:

- `a` / `Ctrl+N` → global add task
- `Shift+A` → add Space
- `Enter` on Space card → focus Space
- `Esc` → return to Overview

Vim motions integrate naturally later.

---

## 11. Guardrails (Do NOT Break)

- No checkboxes for Spaces
- No nested Spaces
- No multiple focused Spaces
- No inline expansion in Overview
- No auto-focus on creation
- No name-based logic (Inbox is not special)

---

## 12. Mental Model (Single Source of Truth)

> **Overview answers “what exists”.
> Spaces answer “what I’m doing”.**

If a feature violates this sentence, it does not belong in v1.

---

## 13. Implementation Confidence

This design is:

- Solo-developer feasible
- Deterministic
- State-minimal
- Power-user oriented
- Extensible without refactors
