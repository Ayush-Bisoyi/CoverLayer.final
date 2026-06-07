components/StatusBadge.jsx
import React from "react";
import { cn } from "@/lib/utils";

const configs = {
  active:       { dot: "bg-green-400",   text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20",   label: "Active" },
  inactive:     { dot: "bg-zinc-400",    text: "text-zinc-400",    bg: "bg-zinc-400/10",    border: "border-zinc-400/20",    label: "Inactive" },
  pending:      { dot: "bg-yellow-400",  text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20",  label: "Pending" },
  suspended:    { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     label: "Suspended" },
  draft:        { dot: "bg-zinc-400",    text: "text-zinc-400",    bg: "bg-zinc-400/10",    border: "border-zinc-400/20",    label: "Draft" },
  expired:      { dot: "bg-zinc-400",    text: "text-zinc-400",    bg: "bg-zinc-400/10",    border: "border-zinc-400/20",    label: "Expired" },
  cancelled:    { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     label: "Cancelled" },
  claimed:      { dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",    label: "Claimed" },
  submitted:    { dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",    label: "Submitted" },
  under_review: { dot: "bg-yellow-400",  text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20",  label: "Under Review" },
  approved:     { dot: "bg-green-400",   text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20",   label: "Approved" },
  rejected:     { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     label: "Rejected" },
  paid:         { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Paid" },
  accepted:     { dot: "bg-green-400",   text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20",   label: "Accepted" },
  declined:     { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     label: "Declined" },
  low:          { dot: "bg-green-400",   text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20",   label: "Low" },
  medium:       { dot: "bg-yellow-400",  text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20",  label: "Medium" },
  high:         { dot: "bg-orange-400",  text: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/20",  label: "High" },
  critical:     { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     label: "Critical" },
};

export default function StatusBadge({ status, label }) {
  const cfg = configs[status] || configs.inactive;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border", cfg.bg, cfg.text, cfg.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {label || cfg.label}
    </span>
  );
}
