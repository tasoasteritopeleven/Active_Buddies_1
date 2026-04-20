/**
 * Shared constants used throughout the application.
 * Centralizes magic strings / options to avoid duplication across pages.
 */

// --- Activity types ---
export const ACTIVITY_TYPES = [
  "Running",
  "Cycling",
  "Yoga",
  "Weightlifting",
  "Swimming",
  "HIIT",
  "Walking",
  "Hiking",
  "Dance",
  "Home Workout",
  "Sports",
  "Gym",
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

// --- Fitness levels ---
export const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const
export type FitnessLevel = (typeof FITNESS_LEVELS)[number]

// --- Workout intensity ---
export const INTENSITY_LEVELS = ["Low", "Medium", "High"] as const

// --- Schedule time slots ---
export const DAY_TYPES = ["Weekdays", "Weekends"] as const
export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const

// --- Location preferences ---
export const LOCATION_PREFERENCES = [
  { value: "local", label: "Local Only" },
  { value: "remote", label: "Remote Only" },
  { value: "both", label: "Both" },
] as const

// --- Goals ---
export const FITNESS_GOALS = [
  "Lose weight",
  "Build muscle",
  "Stay active",
  "Find a fitness community",
  "Train for an event",
  "Improve mental health",
] as const

// --- Weekday labels ---
export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const

// --- Filter presets for the feed ---
export const DATE_RANGE_OPTIONS = ["Anytime", "Today", "This Week", "This Month"] as const

// --- Community member size buckets ---
export const MEMBER_SIZE_BUCKETS = {
  small: { label: "Small (<50)", predicate: (n: number) => n < 50 },
  medium: { label: "Medium (50-200)", predicate: (n: number) => n >= 50 && n <= 200 },
  large: { label: "Large (200+)", predicate: (n: number) => n > 200 },
} as const

// --- Local storage keys ---
export const STORAGE_KEYS = {
  theme: "vite-ui-theme",
  onboarded: "activebuddies_onboarded",
  tokens: "activebuddies_tokens",
} as const

// --- Pagination defaults ---
export const DEFAULT_PAGE_SIZE = 20
