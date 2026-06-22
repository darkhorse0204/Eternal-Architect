export type Weight = 'CRITICAL' | 'STANDARD' | 'FLEXIBLE';

export type Category =
  | 'Framework'
  | 'Database'
  | 'Auth'
  | 'API Style'
  | 'Infra'
  | 'Pattern';

export type ActionType =
  | 'LAW_ADDED'
  | 'CONFLICT_DETECTED'
  | 'AMENDMENT_PROPOSED'
  | 'OVERRIDE_LOGGED'
  | 'BUILD_CANCELLED'
  | 'CHECK_PASSED';

export interface Law {
  id: string;
  title: string;
  description: string;
  category: Category;
  rationale: string;
  weight: Weight;
  depends_on: string[];
  health: string;
  check_count: number;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  action_type: ActionType;
  title: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type CheckState = 'CLEAR' | 'CONFLICT' | 'CASCADE';

export interface CheckResult {
  state: CheckState;
  answer: string;
  confidence: number;
  violatedLaw?: Law;
  cascadeLaws?: Law[];
}
