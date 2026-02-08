"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useTeams } from "@/hooks/use-linear-data";
import { useSettings } from "@/hooks/use-settings";
import { TeamContext } from "@/contexts/team-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: teams } = useTeams();
  const { settings, loaded } = useSettings();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!teams || teams.length === 0 || selectedTeamId) return;

    if (loaded && settings.defaultTeamId) {
      const exists = teams.some((t) => t.id === settings.defaultTeamId);
      if (exists) {
        setSelectedTeamId(settings.defaultTeamId);
        return;
      }
    }

    setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId, loaded, settings.defaultTeamId]);

  return (
    <TeamContext value={{ teamId: selectedTeamId }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
          />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </TeamContext>
  );
}
