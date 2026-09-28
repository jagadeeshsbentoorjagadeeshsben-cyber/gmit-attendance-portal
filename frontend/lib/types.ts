export type ApiStatus = "ON_TRACK" | "CRITICAL" | "NOT_STARTED" | string;

export type DisplayStatus =
  | "EXCELLENT"
  | "ON_TRACK"
  | "AT_RISK"
  | "CRITICAL"
  | "NOT_STARTED";

export interface BufferInfo {
  canMiss: number;
  message: string;
}

export interface RecoveryInfo {
  needed: number;
  message: string;
}

export interface RawSubject {
  courseCode: string;
  subject: string;
  teacher: string;
  attended: number;
  conducted: number;
  percentage: number;
  minimumRequired: number;
  status: ApiStatus;
  isStarted: boolean;
  buffer: BufferInfo;
  recovery: RecoveryInfo;
}

export interface Subject extends RawSubject {
  displayStatus: DisplayStatus;
}

export interface Overall {
  attended: number;
  conducted: number;
  percentage: number;
  minimumRequired: number;
  status: ApiStatus;
  isStarted: boolean;
  displayStatus: DisplayStatus;
}

export interface StudentIdentity {
  usn: string;
  name: string;
  section: string;
}

export interface AttendanceData {
  student: StudentIdentity;
  overall: Overall;
  subjects: Subject[];
  minimumRequired: number;
  updatedAt: string;
  fetchedAt: string;
}

export interface SessionData {
  usn: string;
  section: string;
  name: string;
}

export interface ApiError {
  error: string;
}
