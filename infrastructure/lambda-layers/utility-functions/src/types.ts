/**
 * Shared TypeScript types for JAIIB-CAIIB Exam Prep Portal
 */

export interface User {
  tenant_id: string;
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'officer' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: number;
  updated_at: number;
  last_login?: number;
  session_token?: string;
  session_expires_at?: number;
  mfa_enabled: boolean;
  preferences?: Record<string, unknown>;
}

export interface Question {
  paper: string;
  question_id: string;
  version: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty_level: 'easy' | 'medium' | 'hard';
  status: 'active' | 'inactive' | 'archived';
  created_at: number;
  updated_at: number;
  created_by: string;
  updated_by: string;
  rbi_norms?: string[];
  iibf_norms?: string[];
  syllabus_topic: string;
  explanation_template?: string;
  usage_count: number;
  avg_score: number;
}

export interface PracticeSet {
  tenant_id: string;
  user_id: string;
  practice_set_id: string;
  paper: string;
  created_at: number;
  started_at?: number;
  submitted_at?: number;
  status: 'in_progress' | 'submitted' | 'expired';
  questions: string[];
  user_answers: Record<string, string | null>;
  correct_answers: Record<string, string>;
  score?: number;
  time_taken?: number;
  session_token: string;
  session_expires_at: number;
  ip_address?: string;
  user_agent?: string;
}

export interface Score {
  tenant_id: string;
  user_id: string;
  score_id: string;
  practice_set_id: string;
  paper: string;
  score: number;
  correct_count: number;
  created_at: number;
  time_taken: number;
  difficulty_avg: number;
  performance_trend?: 'improving' | 'stable' | 'declining';
}

export interface AuditLog {
  tenant_id: string;
  created_at: number;
  audit_id: string;
  event_type: 'login' | 'logout' | 'practice_complete' | 'explanation_requested' | 'question_modified' | 'error';
  user_id?: string;
  resource_type?: 'user' | 'question' | 'practice_set' | 'score';
  resource_id?: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  error_message?: string;
  response_time_ms?: number;
}

export interface Explanation {
  explanation_id: string;
  question_id: string;
  correct_answer: string;
  explanation_text: string;
  rbi_norms?: string[];
  iibf_norms?: string[];
  generated_at: number;
  model: string;
}

export interface APIRequest<T = unknown> {
  body?: T;
  headers: Record<string, string>;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    authorizer?: {
      claims?: {
        sub: string;
        email: string;
        'custom:tenant_id': string;
      };
    };
  };
}

export interface APIResponse<T = unknown> {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export interface AuthToken {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
  iat: number;
  exp: number;
}

export interface DashboardMetrics {
  total_practice_sets: number;
  average_score: number;
  paper_stats: Record<string, PaperStats>;
  recent_scores: Score[];
  trend_data: TrendData[];
}

export interface PaperStats {
  average_score: number;
  highest_score: number;
  practice_count: number;
}

export interface TrendData {
  date: string;
  average_score: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: ValidationError[];
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}
