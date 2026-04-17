import { User, Workout, Post, SharedPlan, Challenge, Community, Message } from '../types/database';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const MOCK_PALS = [
  { id: 1, name: "Sarah", image: "https://i.pravatar.cc/150?u=1", online: true, lastActive: "Now", goals: "Marathon training", schedule: "Mornings", location: "2 miles away", activity: "Running", distance: 2, style: "Strict", isPro: true },
  { id: 2, name: "Mike", image: "https://i.pravatar.cc/150?u=2", online: false, lastActive: "2h ago", goals: "Weightlifting, Bulking", schedule: "Evenings", location: "5 miles away", activity: "Gym", distance: 5, style: "Competitive", isPro: false },
  { id: 3, name: "Emma", image: "https://i.pravatar.cc/150?u=3", online: true, lastActive: "Now", goals: "Yoga, Flexibility", schedule: "Flexible", location: "1 mile away", activity: "Yoga", distance: 1, style: "Gentle", isPro: false },
  { id: 4, name: "David", image: "https://i.pravatar.cc/150?u=4", online: false, lastActive: "1d ago", goals: "HIIT, Weight loss", schedule: "Weekends", location: "8 miles away", activity: "Gym", distance: 8, style: "Structured", isPro: false },
  { id: 5, name: "Lisa", image: "https://i.pravatar.cc/150?u=5", online: true, lastActive: "Now", goals: "Calisthenics", schedule: "Mornings", location: "3 miles away", activity: "Gym", distance: 3, style: "Strict", isPro: true },
];

const MOCK_CHALLENGES = [
  { id: 1, title: "10k Steps a Day", daysLeft: 4, participants: 128, progress: 70 },
  { id: 2, title: "Morning Yoga Streak", daysLeft: 12, participants: 45, progress: 30 },
];

const MOCK_MEETUPS = [
  { id: 1, title: "Downtown Run Club", time: "Tomorrow, 7:00 AM", location: "Central Park", attendees: 12 },
  { id: 2, title: "HIIT in the Park", time: "Saturday, 9:00 AM", location: "Riverside Park", attendees: 8 },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "friend_request", message: "Sarah sent you a friend request.", time: "2m ago", userImage: "https://i.pravatar.cc/150?u=1" },
  { id: 2, type: "challenge", message: "You're in the top 10% for 10k Steps!", time: "1h ago", icon: "Trophy" },
  { id: 3, type: "meetup", message: "Downtown Run Club starts tomorrow.", time: "3h ago", icon: "Calendar" },
];

const MOCK_FEED = [
  { id: 1, userId: 1, user: "Sarah", image: "https://i.pravatar.cc/150?u=1", action: "completed a 5k run", time: "2h ago", likes: 4, comments: 1 },
  { id: 2, userId: 2, user: "Mike", image: "https://i.pravatar.cc/150?u=2", action: "hit a 10-day streak", time: "4h ago", likes: 12, comments: 3 },
  { id: 3, userId: 3, user: "Emma", image: "https://i.pravatar.cc/150?u=3", action: "joined Downtown Run Club", time: "5h ago", likes: 2, comments: 0 },
];

const MOCK_STORIES = [
  { id: 0, user: "Your Story", image: "https://i.pravatar.cc/150?u=me", isAdd: true },
  { id: 1, user: "Sarah", image: "https://i.pravatar.cc/150?u=1", hasUnseen: true },
  { id: 2, user: "Mike", image: "https://i.pravatar.cc/150?u=2", hasUnseen: true },
  { id: 3, user: "Emma", image: "https://i.pravatar.cc/150?u=3", hasUnseen: false },
  { id: 4, user: "David", image: "https://i.pravatar.cc/150?u=4", hasUnseen: false },
  { id: 5, user: "Lisa", image: "https://i.pravatar.cc/150?u=5", hasUnseen: false },
];

const MOCK_COMMUNITIES = [
  { id: 1, name: "Beginner Safe Zone", description: "No judgment, form checks, and gym anxiety support.", members: 1240, icon: "Shield", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: 2, name: "Living Room Athletes", description: "Home workout hermits uniting remotely.", members: 850, icon: "BookOpen", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 3, name: "Injury Recovery & Comebacks", description: "Gentle accountability for the comeback kids.", members: 530, icon: "Heart", color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: 4, name: "Campus Connectors", description: "University students building habits together.", members: 2100, icon: "Users", color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: 5, name: "Downtown Run Club", description: "Local runners meeting every Tuesday and Thursday.", members: 340, icon: "MapPin", color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: 6, name: "Charity Runners", description: "Running for a cause. Join our charity marathons and 5Ks.", members: 890, icon: "Heart", color: "text-red-500", bg: "bg-red-500/10" },
  { id: 7, name: "Local Bootcamps", description: "Outdoor high-intensity group training in local parks.", members: 420, icon: "Users", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: 8, name: "Sports Clubs Hub", description: "Connect with local tennis, basketball, and soccer clubs.", members: 1500, icon: "MapPin", color: "text-teal-500", bg: "bg-teal-500/10" },
];

const MOCK_CHATS_DIRECT = [
  { id: 1, name: "Sarah", message: "Are we still on for the run tomorrow?", time: "10:42 AM", unread: true, online: true, image: "https://i.pravatar.cc/150?u=1", type: "direct" },
  { id: 2, name: "Mike", message: "Just finished my leg day! 🦵", time: "Yesterday", unread: false, online: false, image: "https://i.pravatar.cc/150?u=2", type: "direct" },
  { id: 3, name: "Emma", message: "Can you send me that protein recipe?", time: "Mon", unread: false, online: true, image: "https://i.pravatar.cc/150?u=3", type: "direct" },
];

const MOCK_CHATS_GROUP = [
  { id: 4, name: "Morning Runners Club", message: "David: See you all at 6!", time: "8:00 AM", unread: true, members: 12, image: "https://i.pravatar.cc/150?u=10", type: "group" },
  { id: 5, name: "Yoga Enthusiasts", message: "Lisa shared a new flow", time: "Tue", unread: false, members: 45, image: "https://i.pravatar.cc/150?u=11", type: "group" },
];

export const api = {
  // Home Page Data
  getHomeData: async () => {
    await delay(600);
    return {
      pals: MOCK_PALS,
      challenges: MOCK_CHALLENGES,
      meetups: MOCK_MEETUPS,
      notifications: MOCK_NOTIFICATIONS,
      feed: MOCK_FEED,
      stories: MOCK_STORIES,
    };
  },

  // Discover Page Data
  getDiscoverPals: async () => {
    await delay(800);
    return MOCK_PALS;
  },

  // Friends Page Data
  getFriendsData: async () => {
    await delay(700);
    return {
      friends: MOCK_PALS,
      requests: [
        { id: 101, name: "Alex", mutual: 3, time: "2h ago", image: "https://i.pravatar.cc/150?u=8", status: "received" },
        { id: 102, name: "Jordan", mutual: 1, time: "1d ago", image: "https://i.pravatar.cc/150?u=9", status: "received" },
        { id: 103, name: "Taylor", mutual: 5, time: "3d ago", image: "https://i.pravatar.cc/150?u=10", status: "sent" },
      ]
    };
  },

  // Communities Page Data
  getCommunities: async () => {
    await delay(500);
    return MOCK_COMMUNITIES;
  },

  // Challenges Page Data
  getChallenges: async () => {
    await delay(600);
    return [
      { id: 1, title: "10k Steps a Day", type: "Consistency", daysLeft: 4, participants: 128, progress: 70, rank: 12 },
      { id: 2, title: "Morning Yoga Streak", type: "Habit", daysLeft: 12, participants: 45, progress: 30, rank: 5 },
      { id: 3, title: "Heavy Lifters Club", type: "Volume", daysLeft: 20, participants: 89, progress: 45, rank: 1 },
      { id: 4, title: "Campus Run 5K", type: "Event", daysLeft: 2, participants: 310, progress: 90, rank: 45 },
    ];
  },

  // Chats Page Data
  getChats: async () => {
    await delay(400);
    return {
      direct: MOCK_CHATS_DIRECT,
      groups: MOCK_CHATS_GROUP,
    };
  },

  // Profile Page Data
  getProfile: async () => {
    await delay(500);
    return {
      name: "Alex Johnson",
      username: "@alexruns",
      location: "San Francisco, CA",
      bio: "Runner & Yoga enthusiast. Training for a half marathon!",
      interests: "Running, Yoga, HIIT",
      image: "https://i.pravatar.cc/150?u=alex",
      isPro: true,
      reliabilityScore: 98,
      reviews: [
        { id: 1, author: "Sarah M.", rating: 5, text: "Alex is a great running buddy! Always on time and very motivating.", date: "2 weeks ago" },
        { id: 2, author: "Mike T.", rating: 5, text: "Awesome yoga sessions together. Highly recommend connecting with Alex.", date: "1 month ago" }
      ]
    };
  },

  getPalProfile: async (id: number) => {
    await delay(500);
    return {
      id: id,
      name: "Jessica T.",
      username: "@jesstrains",
      bio: "Marathon runner & yoga enthusiast. Always looking for a running buddy in the mornings! 🏃‍♀️🧘‍♀️",
      image: `https://i.pravatar.cc/150?u=${id}`,
      location: "2 miles away",
      schedule: "Mornings",
      goals: "Marathon training",
      online: true,
      lastActive: "Now",
      isPro: true,
      reliabilityScore: 95,
      stats: { workouts: 142, streak: 12, level: 24 },
      reviews: [
        { id: 1, author: "Alex J.", rating: 5, text: "Jessica is an amazing running partner!", date: "1 week ago" }
      ]
    };
  },

  getChatConversation: async (id: number) => {
    await delay(500);
    return {
      id: id,
      pal: MOCK_CHATS_DIRECT.find(c => c.id === Number(id)) || MOCK_CHATS_DIRECT[0],
      messages: [
        { id: 1, senderId: 2, text: "Hey! Ready for the workout tomorrow?", time: "10:30 AM", isMe: false },
        { id: 2, senderId: 1, text: "Absolutely, can't wait!", time: "10:32 AM", isMe: true },
        { id: 3, senderId: 2, text: "Are we still on for the run?", time: "10:42 AM", isMe: false },
      ]
    };
  },

  sendMessage: async (chatId: number, text: string) => {
    await delay(300);
    console.log("Message sent to chat:", chatId, text);
    return { 
      id: Date.now(), 
      senderId: 1, 
      text, 
      time: "Just now", 
      isMe: true 
    };
  },

  // Experts Page Data
  getExpertsData: async () => {
    await delay(600);
    return {
      articles: [
        { id: 1, title: "The Science of Muscle Hypertrophy", author: "Dr. Sarah Jenkins", readTime: "5 min read", category: "Training" },
        { id: 2, title: "Optimal Nutrition for Endurance Athletes", author: "Mark Thompson, RD", readTime: "8 min read", category: "Nutrition" },
        { id: 3, title: "Recovery Protocols: Sleep and Stretching", author: "Elena Rostova, PT", readTime: "6 min read", category: "Recovery" },
      ],
      videos: [
        { id: 1, title: "Perfecting Your Deadlift Form", expert: "Coach Mike", duration: "12:45", thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" },
        { id: 2, title: "15-Minute Mobility Routine", expert: "Yoga with Anna", duration: "15:20", thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80" },
      ],
      liveSessions: [
        { id: 1, title: "Injury Prevention", expert: "Dr. Robert Chen", initials: "DR", color: "text-accent", bg: "bg-accent/20", time: "Today, 18:00", isToday: true },
        { id: 2, title: "Macro Tracking 101", expert: "Sarah Miller, Nutritionist", initials: "SM", color: "text-blue-500", bg: "bg-blue-500/20", time: "Tomorrow, 19:00", isToday: false }
      ]
    };
  },

  // Settings Page Data
  getSettings: async () => {
    await delay(400);
    return {
      notificationsEnabled: true,
      notifyFriendActivity: true,
      notifyChallenges: true,
      notifyCommunity: false,
      dailySummary: true,
      goalReminders: true,
      privateProfile: false,
      allowMessages: true,
      isPro: false,
      proProfession: ""
    };
  },

  updateSettings: async (settings: any) => {
    await delay(600);
    console.log("Settings updated:", settings);
    return { success: true };
  },

  // Mutations (Actions)
  logWorkout: async (workoutData: any) => {
    await delay(1000);
    console.log("Workout logged:", workoutData);
    return { success: true, message: "Workout logged successfully" };
  },

  createPost: async (postData: any) => {
    await delay(800);
    console.log("Post created:", postData);
    return { success: true, message: "Post created successfully" };
  },

  sendConnectionRequest: async (userId: number) => {
    await delay(500);
    console.log("Connection request sent to user:", userId);
    return { success: true };
  },

  acceptFriendRequest: async (requestId: number) => {
    await delay(500);
    console.log("Friend request accepted:", requestId);
    return { success: true };
  },

  declineFriendRequest: async (requestId: number) => {
    await delay(500);
    console.log("Friend request declined:", requestId);
    return { success: true };
  },

  removeFriend: async (friendId: number) => {
    await delay(600);
    console.log("Friend removed:", friendId);
    return { success: true };
  },

  sendNudge: async (userId: number) => {
    await delay(300);
    console.log("Nudge sent to user:", userId);
    return { success: true };
  },

  checkIn: async () => {
    await delay(400);
    console.log("Daily check-in completed");
    return { success: true };
  },

  buddyCheckIn: async (buddyId: number) => {
    await delay(400);
    console.log("Buddy check-in sent to:", buddyId);
    return { success: true };
  }
};
