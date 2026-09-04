"use client";

import { RequireStaff } from "@/features/staff/RequireStaff";
import { StaffShell } from "@/features/staff/StaffShell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireStaff>
      <StaffShell>{children}</StaffShell>
    </RequireStaff>
  );
}
