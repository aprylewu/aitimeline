import { headers } from "next/headers";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "@/components/timeline/timeline-browser";

export default async function Home() {
  const requestHeaders = await headers();
  const viewerTimeZone =
    requestHeaders.get("x-vercel-ip-timezone") ?? undefined;

  return (
    <TimelineBrowser
      conferences={conferences}
      now={new Date()}
      viewerTimeZone={viewerTimeZone}
    />
  );
}
