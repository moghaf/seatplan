import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { Team, TeamMember, WeekInfo, SeatWithAssignments } from '../types';

export function useData(functionId?: number) {
  const [seats, setSeats] = useState<SeatWithAssignments[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (functionId === undefined) return;
    setLoading(true);
    try {
      const [t, m, w, s] = await Promise.all([
        api.teams.list(functionId),
        api.members.list(functionId),
        api.weeks.list(),
        api.seats.listWithAssignments(functionId),
      ]);
      setTeams(t);
      setMembers(m);
      setWeeks(w.weeks);
      setSeats(s);
    } finally {
      setLoading(false);
    }
  }, [functionId]);

  useEffect(() => {
    if (functionId === undefined) {
      setSeats([]);
      setTeams([]);
      setMembers([]);
      setWeeks([]);
      setLoading(false);
      return;
    }
    load();
  }, [load, functionId]);

  return { seats, teams, members, weeks, loading, refresh: load };
}
