export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  location: string;
  bio: string;
  interests: string[];
  profileImage: string;
  activityStreaks: number;
  totalWorkouts: number;
  friendsCount: number;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  settings: {
    theme: 'light' | 'dark' | 'sport';
    notifications: {
      push: boolean;
      friendActivity: boolean;
      challenges: boolean;
      community: boolean;
      dailySummary: boolean;
      goalReminders: boolean;
    };
    privateProfile: boolean;
  };
}

export interface Workout {
  id: string;
  userId: string;
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'Low' | 'Medium' | 'High';
  isPersonalBest: boolean;
  notes: string;
  timestamp: number; // Timestamp
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  timestamp: number; // Timestamp
}

export interface SharedPlan {
  id: string;
  title: string;
  creatorId: string;
  participantIds: string[];
  durationWeeks: number;
  progressPercentage: number;
  workouts: {
    day: number;
    description: string;
    completedBy: string[]; // User IDs
  }[];
  createdAt: number; // Timestamp
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: number; // Timestamp
  endDate: number; // Timestamp
  participantIds: string[];
  goalMetric: 'steps' | 'workouts' | 'calories' | 'distance';
  goalValue: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  tags: string[];
  createdAt: number; // Timestamp
}

export interface Message {
  id: string;
  chatId: string; // Direct or Group chat ID
  senderId: string;
  content: string;
  timestamp: number; // Timestamp
  readBy: string[]; // User IDs
}
