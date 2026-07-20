// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9005/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sbts-backend.onrender.com/api";

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Interface Types

export interface StatsData {
  success: boolean;
  stats: {
    totalBuses: number;
    activeBuses: number;
    totalRoutes: number;
    activeTracking: number;
    delaysCount: number;
    alertNotifications: number;
    totalUsers: number;
    totalSchedules: number;
  };
}

export interface RouteStop {
  _id: string;
  name: string;
  timeOffset?: number;
  type: "start" | "stop" | "end";
}

export interface RouteData {
  _id: string;
  routeNo: string;
  from: string;
  to: string;
  via?: string;
  frequency: string;
  status: string;
  color: string;
  active: boolean;
  stops: RouteStop[];
  pathCoordinates: [number, number][];
}

export interface RoutesResponse {
  success: boolean;
  routes: RouteData[];
}

export interface BusData {
  _id: string;
  busNumber: string;
  modelName?: string;
  capacity?: number;
  status: string;
}

export interface TrackingData {
  _id: string;
  bus: BusData;
  route: RouteData;
  latitude: number;
  longitude: number;
  speed: number;
  nextStop?: string;
  eta?: string;
  status: string;
  currentIndex: number;
}

export interface TrackingResponse {
  success: boolean;
  tracking: TrackingData[];
}

export interface ScheduleData {
  _id: string;
  route: RouteData;
  bus: BusData;
  firstBus: string;
  lastBus: string;
  frequency: string;
  status: string;
  active: boolean;
}

export interface SchedulesResponse {
  success: boolean;
  schedules: ScheduleData[];
}

export interface NotificationData {
  _id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  read?: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationData[];
}

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

// User types
export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: UserData[];
}

// Banner types
export interface BannerData {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface BannersResponse {
  success: boolean;
  banners: BannerData[];
}

// Team types
export interface TeamData {
  _id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  linkedin: string;
  order: number;
  createdAt: string;
}

export interface TeamResponse {
  success: boolean;
  members: TeamData[];
}

// List responses
export interface BusesResponse {
  success: boolean;
  buses: BusData[];
}

// Single item responses
export interface BusResponse {
  success: boolean;
  bus: BusData;
}

export interface RouteResponse {
  success: boolean;
  route: RouteData;
}

export interface ScheduleResponse {
  success: boolean;
  schedule: ScheduleData;
}

export interface NotificationResponse {
  success: boolean;
  notification: NotificationData;
}
