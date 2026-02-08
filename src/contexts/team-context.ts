import { createContext, useContext } from "react";

interface TeamContextValue {
  teamId: string | null;
}

export const TeamContext = createContext<TeamContextValue>({ teamId: null });

export function useTeamContext(): TeamContextValue {
  return useContext(TeamContext);
}
