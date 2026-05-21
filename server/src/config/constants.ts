export const API_PREFIX = '/api/v1';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000;

export const IOT_STATION_CODE = 'IOT-SIM-01';

export const AUDIT_COMPONENTS = {
  AUTH: 'Auth',
  USERS: 'Users',
  SLOTS: 'Slots',
  ASSIGNMENTS: 'Assignments',
  INVOICES: 'Invoices',
  SETTINGS: 'Settings',
  STATIONS: 'Stations',
  NOTIFICATIONS: 'Notifications',
} as const;
