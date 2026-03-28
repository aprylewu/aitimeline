# AI Timeline

AI Timeline is a conference deadline browser focused on the submission to
decision chain for AI and adjacent research venues. It provides a single-page,
interactive timeline for tracking paper deadlines, rebuttal windows,
notifications, and conference dates.

Live site: [https://www.ai-timeline.net/](https://www.ai-timeline.net/)

Built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- Live web app available at
  [https://www.ai-timeline.net/](https://www.ai-timeline.net/)
- Interactive timeline view for the full submission, rebuttal, decision, and
  conference cycle
- Search by conference name
- Filter by category
- Toggle visible milestone types such as full paper, rebuttal, notification,
  camera ready, and conference dates
- Range presets for `3M`, `6M`, `12M`, and `All`
- Automatic grouping into `Active` and `Past` sections
- Countdown tooltip for each milestone with time converted to the viewer's
  local timezone
- Direct links to official conference websites and CFP pages when available
- Responsive layout with a compact mobile controls view
- Light and dark theme toggle

## Conference Data

Conference data lives in
[`src/data/conferences.ts`](./src/data/conferences.ts). The live site reads
from this dataset to render the timeline.

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

Run the app locally:

```bash
npm run dev
```

Then open `http://localhost:3000`.

Run checks:

```bash
npm run test -- --run
npm run lint
npm run build
```
