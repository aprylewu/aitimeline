# GitHub CI Workflow Design

**Date:** 2026-03-27

## Goal

Add a minimal GitHub Actions workflow that validates code quality for this repository without introducing deployment or preview behavior.

## Approved Direction

Use one workflow that runs on:

- pull requests targeting `main`
- pushes to `main`

The workflow should run the same three checks developers already use locally:

- `npm run test -- --run`
- `npm run lint`
- `npm run build`

## Scope

- Add a single workflow file under `.github/workflows/`
- Use `npm ci` for dependency installation
- Set up a stable Node.js runtime suitable for Next.js 16, React 19, and Vitest
- Keep the workflow simple and readable

## Non-Goals

- No deployment
- No preview environments
- No matrix across multiple Node versions
- No caching beyond what `actions/setup-node` provides easily
- No branch protection changes inside the repository

## Workflow Shape

Use a single `ci` job:

1. Checkout repository
2. Set up Node.js
3. Install dependencies with `npm ci`
4. Run tests
5. Run ESLint
6. Run production build

This keeps CI behavior aligned with the local verification sequence already used for feature work.

## Trigger Strategy

### Recommended

- `pull_request` on `main`
- `push` on `main`

This minimizes duplicate runs while still verifying both PRs and the final merged result on the main branch.

### Not Chosen

- All branch pushes plus PRs: too noisy for the current repo size
- PRs only: misses a direct verification of the post-merge main branch state

## Testing Strategy

Because workflow files are configuration, verification should focus on:

- a small repository test that asserts the workflow file exists and includes the expected triggers and commands
- local project verification with `npm run test -- --run`, `npm run lint`, and `npm run build`

## Risks

- GitHub Actions YAML can drift from local commands if scripts change later
- Using a very new Node version in CI could hide environment mismatches, so the version should be explicit

## Recommendation

Pin the workflow to a current LTS Node release and keep one small CI file. Expand later only when the repository needs deployment, preview environments, or parallelized checks.
