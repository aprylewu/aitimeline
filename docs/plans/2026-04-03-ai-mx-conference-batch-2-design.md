# AI/MX Conference Batch 2 Design

**Goal:** Add a second conservative batch of 2026 conferences to the local static dataset, focusing on high-confidence `AI` and `MX` venues with officially published 2026 dates.

## Approved Scope

This batch adds exactly four conferences:

- `UAI 2026`
- `ICAPS 2026`
- `ECCV 2026`
- `RECOMB 2026`

The batch intentionally excludes:

- `NAACL 2026` and `COLING 2026`, because no official 2026 CFP/date chain was verified.
- `ECAI 2026`, because the current official data is tied to a joint `IJCAI-ECAI 2026` event while the repo already contains a standalone `IJCAI 2026` entry; mixing both without a dedicated cleanup pass would create conflicting records.
- `ICRA 2026`, `BIBM 2026`, and `BigData 2026`, because the selected four already provide balanced `AI` and `MX` coverage with cleaner milestone chains.

## Data Strategy

Keep the current architecture unchanged by extending the static `conferences` array in `src/data/conferences.ts`.

For each conference:

- use official conference or organizer pages as the source of truth for dates and location
- use `ccfddl/ccf-deadlines` only as a candidate list and ranking reference
- include only milestones that are explicitly published
- keep milestones chronological
- omit unofficial or ambiguous side events rather than inferring them

## Category Mapping

- `UAI` and `ICAPS` map to `AI`
- `ECCV` and `RECOMB` map to `MX`

This follows the repo's existing presentation model, where vision-oriented venues live under `MX` even if external sources classify them differently.

## Milestone Modeling

- `UAI`: `fullPaper`, `rebuttalStart`, `rebuttalEnd`, `notification`, `conferenceStart`, `conferenceEnd`
- `ICAPS`: `abstract`, `fullPaper`, `rebuttalStart`, `rebuttalEnd`, `notification`, `conferenceStart`, `conferenceEnd`
- `ECCV`: `abstract`, `fullPaper`, `supplementary`, `rebuttalStart`, `rebuttalEnd`, `notification`, `cameraReady`, `workshop`, `conferenceStart`, `conferenceEnd`
- `RECOMB`: `abstract`, `fullPaper`, `notification`, `cameraReady`, `conferenceStart`, `conferenceEnd`

## Testing Strategy

Extend `src/data/conferences.test.ts` with one new existence test for the four ids and one detailed regression test covering representative rankings, locations, and milestone dates.

The implementation will follow TDD:

1. write the new failing assertions
2. run the focused test and confirm it fails for missing entries
3. add the minimal conference records
4. rerun focused and full verification
