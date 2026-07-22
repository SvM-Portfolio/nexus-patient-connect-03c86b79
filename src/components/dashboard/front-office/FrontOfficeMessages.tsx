import { MessagesPanel } from "@/components/dashboard/physician/MessagesPanel";

// Front office reuses the same messages summary. In future we scope by category.
export function FrontOfficeMessages() {
  return <MessagesPanel />;
}
