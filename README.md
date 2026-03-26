# AI Timeline

Single-page conference timeline browser built with Next.js, React, TypeScript,
and Tailwind CSS.

## Conference Data

Conference data lives in
[`src/data/conferences.ts`](./src/data/conferences.ts).

When adding a conference:

1. Add a new `Conference` object to the exported `conferences` array.
2. Keep milestone entries in chronological order.
3. Use `YYYY-MM-DD` date strings and set the milestone `timezone` explicitly.
4. Prefer official conference links for `website` and official CFP dates when
   they are available.

Supported milestone types:

- `abstract`
- `fullPaper`
- `supplementary`
- `rebuttalStart`
- `rebuttalEnd`
- `notification`
- `cameraReady`
- `conferenceStart`
- `conferenceEnd`
- `workshop`

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run checks:

```bash
npm run test -- --run
npm run lint
npm run build
```
