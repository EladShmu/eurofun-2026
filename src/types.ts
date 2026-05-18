export interface Country {
  id: string;
  name: string;
  flag: string;
  isoCode: string;
  performanceOrder: number;
}

export interface RankedCountry {
  countryId: string;
  description: string;
  notes: string;
  addedOrder: number;
  personalScore: number | null;
  audienceScore: number | null;
  judgeScore: number | null;
}

export interface UserData {
  uid: string;
  username: string;
  rankedList: RankedCountry[];
  pool: string[];
  groups: string[];       // group codes this user has joined
  lastUpdated: number;
  avatar?: string;               // animal emoji (e.g. "🦊") or Firebase Storage photo URL
  onboardingComplete?: boolean;  // true after user completes onboarding wizard
}

export interface CountryScore {
  jury?: number;
  audience?: number;
  total?: number;
}

export interface GlobalConfig {
  rankingFrozen?: boolean;
  actualResults?: string[];
  actualScores?: Record<string, CountryScore>;
  autoResultsEnabled?: boolean;
  autoResultsSources?: string[];
  autoResultsLastRequestedAt?: number;
  autoResultsLastUpdatedAt?: number;
  autoResultsStatus?: 'idle' | 'requested' | 'running' | 'success' | 'error';
  autoResultsError?: string;
}

export interface GroupData {
  name: string;
  nameLower: string;
  code: string;
  password: string;            // 4-digit numeric, auto-generated (empty if isOpen)
  isOpen?: boolean;            // if true, no password required to join
  createdBy: string;           // uid
  createdAt: number;
  members: string[];           // uid[]
  memberNames: Record<string, string>; // uid → username
  actualResults: string[];                         // country IDs in final order (up to 25)
  actualScores?: Record<string, CountryScore>;     // raw jury+audience scores per country
}
