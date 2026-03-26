import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "@/components/timeline/timeline-browser";

export default function Home() {
  return <TimelineBrowser conferences={conferences} now={new Date()} />;
}
