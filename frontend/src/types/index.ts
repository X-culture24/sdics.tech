/* ==================== Authentication ==================== */

export interface LoginRequest {
  national_id: string;
  pin: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface Officer {
  id: number;
  national_id: string;
  full_name: string;
  phone: string;
  role: 'REGISTRATION_OFFICER' | 'SUPERVISOR' | 'ADMINISTRATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  last_login: string | null;
  created_at: string;
}

export interface OfficerWithLocations extends Officer {
  assigned_locations: OfficerAssignedLocation[];
}

export interface OfficerAssignedLocation {
  id: number;
  county: string | null;
  district: string | null;
  division: string | null;
  location: string | null;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  officer: Officer | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/* ==================== Citizen ==================== */

export interface Citizen {
  id: number;
  national_id: string;
  full_name: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  date_of_birth: string | null;
  tribe: string | null;
  phone_number: string | null;
  county: string;
  district: string;
  division: string;
  location: string;
  sub_location: string | null;
  village: string | null;
  registration_status: 'UNREGISTERED' | 'REGISTERED';
  registered_at: string | null;
  registered_by: number | null;
  campaign: number | null;
  source_file: string | null;
  created_at: string;
}

export interface CitizenSearchParams {
  national_id?: string;
  full_name?: string;
  county?: string;
  district?: string;
  division?: string;
  location?: string;
  sub_location?: string;
  village?: string;
  registration_status?: 'UNREGISTERED' | 'REGISTERED';
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ==================== Registration ==================== */

export interface RegisterCitizenRequest {
  citizen_id: number;
  campaign_id?: number;
  device_info?: DeviceInfo;
  location?: string;
}

export interface Registration {
  id: number;
  citizen: number;
  officer: number;
  campaign: number | null;
  registered_at: string;
  location: string | null;
  device_info: DeviceInfo;
  ip_address: string | null;
  created_at: string;
}

export interface DeviceInfo {
  device?: string;
  os?: string;
  browser?: string;
  app_version?: string;
  [key: string]: unknown;
}

/* ==================== Campaign ==================== */

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  target_count: number | null;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
  created_by: number;
  created_at: string;
}

/* ==================== Dashboard ==================== */

export interface DashboardSummary {
  total_citizens: number;
  registered_count: number;
  unregistered_count: number;
  registrations_today: number;
  total_officers: number;
  registration_percentage: number;
}

export interface CountyMetrics {
  county: string;
  total_count: number;
  registered_count: number;
  unregistered_count: number;
  registration_percentage: number;
}

export interface DistrictMetrics {
  county: string;
  district: string;
  total_count: number;
  registered_count: number;
  unregistered_count: number;
  registration_percentage: number;
}

export interface OfficerMetrics {
  officer_id: number;
  officer_name: string;
  national_id: string;
  role: string;
  registrations_count: number;
  registrations_today: number;
  last_registration_at: string;
}

export interface TrendPoint {
  date: string;
  count: number;
}

/* ==================== Audit Log ==================== */

export interface AuditLog {
  id: number;
  user: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/* ==================== Import Log ==================== */

export interface ImportLog {
  id: number;
  file_path: string;
  county: string | null;
  sheet_name: string;
  total_rows: number;
  processed_count: number;
  skipped_count: number;
  duplicate_count: number;
  failed_count: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/* ==================== API Responses ==================== */

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

/* ==================== Location Hierarchy ==================== */

export interface LocationOption {
  value: string;
  label: string;
}

export interface LocationHierarchy {
  counties: LocationOption[];
  districts: Record<string, LocationOption[]>;
  divisions: Record<string, LocationOption[]>;
  locations: Record<string, LocationOption[]>;
  subLocations: Record<string, LocationOption[]>;
  villages: Record<string, LocationOption[]>;
}

/* ==================== PWA State ==================== */

export interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  hasNotificationPermission: boolean;
}

/* ==================== Notification ==================== */

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}
