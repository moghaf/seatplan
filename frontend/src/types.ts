export interface Team {
  id: number;
  name: string;
  color: string;
  description: string | null;
  functionId: number;
  members: TeamMember[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string | null;
  teamId: number;
  teamName?: string;
}

export interface Seat {
  id: number;
  name: string;
  functionId: number;
  positionX?: number | null;
  positionY?: number | null;
}

export interface DayInfo {
  date: string;
  dayOfWeek: number;
  dayName: string;
  shortLabel: string;
  persianDate: string;
  holiday: string | null;
}

export interface WeekInfo {
  weekNumber: number;
  label: string;
  days: DayInfo[];
}

export interface AssignmentInfo {
  id: number;
  teamMemberId: number;
  memberName: string;
  teamName: string;
  teamColor: string;
  date: string;
}

export interface SeatWithAssignments extends Seat {
  assignments: AssignmentInfo[];
  disabledDates: string[];
}

export interface WorkFunction {
  id: number;
  name: string;
  description: string | null;
}

export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  role: string;
  teamMemberId: number | null;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface Holiday {
  id: number;
  name: string;
  month: number;
  day: number;
}
