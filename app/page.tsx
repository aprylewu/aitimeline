import { TimelineBrowser } from "@/components/timeline/timeline-browser";
import { getConferences } from "@/lib/data/get-conferences";

export const revalidate = 86400;

export default async function Home() {
  const conferences = await getConferences();

  return <TimelineBrowser conferences={conferences} now={new Date()} />;
}
