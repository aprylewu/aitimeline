# Add AI/MX Conference Batch 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `UAI 2026`, `ICAPS 2026`, `ECCV 2026`, and `RECOMB 2026` to the local conference dataset using officially published 2026 milestones.

**Architecture:** Extend the existing static conference table in `src/data/conferences.ts` and keep the UI/data flow unchanged. Use conservative milestone modeling so only official, explicitly published dates are encoded, while tests pin the new records and a few representative milestone values.

**Tech Stack:** TypeScript, static data modules, Vitest, ESLint, Next.js

---

### Task 1: Add failing regression coverage for the second AI/MX batch

**Files:**
- Modify: `src/data/conferences.test.ts`

**Step 1: Write the failing test**

Add one test asserting the four new conference ids exist and one test asserting representative metadata and milestone dates for:

- `uai-2026`
- `icaps-2026`
- `eccv-2026`
- `recomb-2026`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/conferences.test.ts`
Expected: FAIL because the new conference entries are not present yet.

**Step 3: Write minimal implementation**

Do not implement here. This task ends with the red test.

**Step 4: Commit**

Do not commit yet.

### Task 2: Add the four approved conference records

**Files:**
- Modify: `src/data/conferences.ts`

**Step 1: Add normalized conference entries**

Add records for:

- `UAI 2026`
- `ICAPS 2026`
- `ECCV 2026`
- `RECOMB 2026`

Each record must include:

- `id`, `slug`, `title`, `shortName`, `year`, `website`, `cfpUrl` when available
- `location`
- repo-consistent `category`
- `rankings` from verified `ccfddl` metadata
- only officially published milestones

**Step 2: Keep milestones conservative**

- No inferred camera-ready, rebuttal, workshop, or side-event dates
- Keep milestone ordering chronological
- Use repo-consistent timezone labels such as `AoE`, `UTC-12`, `Europe/Stockholm`, or `Local` only when supported by the source wording already normalized elsewhere in the file

### Task 3: Make the focused tests pass

**Files:**
- Modify: `src/data/conferences.ts`
- Modify: `src/data/conferences.test.ts`

**Step 1: Run the focused test**

Run: `npm test -- src/data/conferences.test.ts`
Expected: PASS after the four records are correct.

**Step 2: Fix mismatches minimally**

If the test fails, adjust only the mismatched fields needed to reflect the official data.

### Task 4: Run project verification

**Files:**
- No file changes expected

**Step 1: Run test suite**

Run: `npm test`
Expected: all tests pass.

**Step 2: Run lint**

Run: `npm run lint`
Expected: no lint errors.

**Step 3: Run build**

Run: `npm run build`
Expected: successful production build.

### Task 5: Summarize scope and source constraints

**Files:**
- No file changes expected

**Step 1: Report scope**

Mention that this batch adds exactly four conferences: `UAI`, `ICAPS`, `ECCV`, and `RECOMB`.

**Step 2: Report exclusions**

Mention that venues without verified official 2026 publication chains, plus the current `ECAI`/`IJCAI` joint-event case, were intentionally left out.
