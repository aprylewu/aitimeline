# Add 2026 CCF Conferences Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the approved first batch of missing 2026 conferences from the CCF Deadlines source into the local conference dataset, using only officially confirmed submission and conference dates.

**Architecture:** Extend the static conference data table in `src/data/conferences.ts` with a conservative, normalized set of new conference entries. Keep the current rendering model unchanged by only encoding milestones that are officially known and representing missing items through omitted milestones plus `detailNote` where useful.

**Tech Stack:** TypeScript, static data modules, Vitest

---

### Task 1: Add regression tests for the approved additions

**Files:**
- Modify: `src/data/conferences.test.ts`

**Step 1: Write the failing test**

Add tests that assert the newly approved conference ids exist and that a representative conference from each category has the expected critical milestones.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/data/conferences.test.ts`
Expected: FAIL because the new conference entries are not present yet.

**Step 3: Write minimal implementation**

Do not implement here. This task ends with the red test.

**Step 4: Commit**

Do not commit yet.

### Task 2: Add the approved AI, CG, HI, and MX conference entries

**Files:**
- Modify: `src/data/conferences.ts`

**Step 1: Add normalized conference records**

Add these approved 2026 entries with only officially confirmed fields:
- `AAAI 2026`
- `AISTATS 2026`
- `IJCAI 2026`
- `3DV 2026`
- `Eurographics 2026`
- `EuroVis 2026`
- `DIS 2026`
- `ECSCW 2026`
- `MLSys 2026`
- `MICCAI 2026`
- `SIGSPATIAL 2026`
- `WWW 2026`

Use the repo’s existing conventions for:
- `id`, `slug`
- `rankings`
- milestone ordering
- `timezone` labels
- omission of unknown milestones
- `detailNote` only when needed to clarify officially unpublished stages or known source caveats

**Step 2: Keep data conservative**

For each conference:
- include `abstract` only if officially separate
- include `fullPaper` only when officially published
- include `rebuttal`, `notification`, `cameraReady`, `workshop` only when officially published
- include `conferenceStart` and `conferenceEnd`
- do not infer workshop dates from proposals or satellite-event placeholders unless the actual event dates are explicit

### Task 3: Make the tests pass

**Files:**
- Modify: `src/data/conferences.ts`
- Modify: `src/data/conferences.test.ts`

**Step 1: Run the focused test**

Run: `npm test -- --run src/data/conferences.test.ts`
Expected: PASS after the data additions are correct.

**Step 2: Fix any mismatches minimally**

If a test fails, only adjust the specific conference fields needed to match the approved official data.

### Task 4: Run project verification

**Files:**
- No file changes expected

**Step 1: Run test suite**

Run: `npm test -- --run`
Expected: all tests pass.

**Step 2: Run lint**

Run: `npm run lint`
Expected: no lint errors.

**Step 3: Run build**

Run: `npm run build`
Expected: successful production build.

### Task 5: Summarize source assumptions in the final response

**Files:**
- No file changes expected

**Step 1: Report scope clearly**

Mention that only the approved 12-conference batch was added.

**Step 2: Report exclusions clearly**

Mention that rolling or multi-round venues and conferences without a verified submission-deadline plus conference-date pair were intentionally left out.
