export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  DRIVER = "driver",
  PUBLIC_USER = "public_user",
  LEGACY_COMPANY_ADMIN = "company_admin",
  LEGACY_PUBLIC_USER = "passenger",
}

export const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

export const normalizeUserRole = (role?: string | null): string => {
  switch (role) {
    case UserRole.LEGACY_COMPANY_ADMIN:
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    case UserRole.LEGACY_PUBLIC_USER:
    case UserRole.PUBLIC_USER:
      return UserRole.PUBLIC_USER;
    case UserRole.SUPER_ADMIN:
      return UserRole.SUPER_ADMIN;
    case UserRole.DRIVER:
      return UserRole.DRIVER;
    default:
      return role ?? UserRole.PUBLIC_USER;
  }
};