/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { Layout } from "./components/Layout"
import { Home } from "./pages/Home"
import { Discover } from "./pages/Discover"
import { Chats } from "./pages/Chats"
import { ChatConversation } from "./pages/ChatConversation"
import { Profile } from "./pages/Profile"
import { Friends } from "./pages/Friends"
import { Settings } from "./pages/Settings"
import { PalProfile } from "./pages/PalProfile"
import { Communities } from "./pages/Communities"
import { Challenges } from "./pages/Challenges"
import { About } from "./pages/About"
import { Experts } from "./pages/Experts"
import { Login } from "./pages/Login"
import { SignUp } from "./pages/SignUp"
import { Onboarding } from "./pages/Onboarding"
import { StoryView } from "./pages/StoryView"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ErrorBoundary } from "./components/ErrorBoundary"

function ProtectedRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (isAuthenticated && isOnboarded) return <Navigate to="/" replace />;
  if (isAuthenticated && !isOnboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function OnboardingRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboarded) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          {/* Onboarding Route */}
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* Protected Routes inside Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/story/:id" element={<StoryView />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="discover" element={<Discover />} />
              <Route path="chats" element={<Chats />} />
              <Route path="chats/:id" element={<ChatConversation />} />
              <Route path="profile" element={<Profile />} />
              <Route path="friends" element={<Friends />} />
              <Route path="settings" element={<Settings />} />
              <Route path="user/:id" element={<PalProfile />} />
              <Route path="communities" element={<Communities />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="experts" element={<Experts />} />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  )
}

