import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

/* ================= AUTH ================= */
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

/* ================= DASHBOARD ================= */
import DashboardRouter from "./pages/dashboard/DashboardRouter";

/* ================= STUDENT ================= */
import SkillMapper from "./pages/student/SkillMapper";
import TeamBuilder from "./pages/student/TeamBuilder";
import TeamSpace from "./pages/student/TeamSpace";
import InnovationLab from "./pages/student/InnovationLab";
import InnovationIdea from "./components/student/InnovationIdea";
import RoleSimulator from "./pages/student/RoleSimulator";
import Gamification from "./pages/student/Gamification";
import AiLearningSession from "./pages/student/AiLearningSession";
import LearningHub from "./pages/student/LearningHub";
import SkillGaps from "./pages/student/Skillgaps";
import FutureStory from "./pages/student/FutureStory";
import CareerCoach from "./pages/student/CareerCoach";
/* ================= SHARED ================= */
import Community from "./pages/community/Community";
import TeamChat from "./components/chat/TeamChat";

/* ================= MENTOR ================= */
import MyMentees from "./pages/mentor/MyMentees";
import MentorMyTeams from "./pages/mentor/MentorMyTeams";
import MentorTeamView from "./components/mentor/MentorTeamView";
import MentorResearch from "./pages/mentor/MentorResearch";
import MentorCollaboration from "./pages/mentor/MentorCollaboration";
import MentorAnnouncements from "./pages/mentor/MentorAnnouncements";
import MentorPlagiarism from "./pages/mentor/MentorPlagiarism";
/* ================= ROUTE GUARDS ================= */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const MentorRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (user.role !== "mentor") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/* ================= APP ================= */

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>

            {/* ---------- DEFAULT ---------- */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ---------- AUTH ---------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ---------- DASHBOARD ---------- */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* ---------- STUDENT ROUTES ---------- */}
            <Route path="/skill-mapper" element={<ProtectedRoute><SkillMapper /></ProtectedRoute>} />
            <Route path="/team-builder" element={<ProtectedRoute><TeamBuilder /></ProtectedRoute>} />
            <Route path="/student/team/:teamId" element={<ProtectedRoute><TeamSpace /></ProtectedRoute>} />
            <Route path="/innovation-lab" element={<ProtectedRoute><InnovationLab /></ProtectedRoute>} />
            <Route path="/innovation-lab/idea/:id" element={<ProtectedRoute><InnovationIdea /></ProtectedRoute>} />
            <Route path="/role-simulator" element={<ProtectedRoute><RoleSimulator /></ProtectedRoute>} />
            <Route path="/learning-hub" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
            <Route path="/learning/skill-gaps" element={<ProtectedRoute><SkillGaps /></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
            <Route path="/ai-skill-arena" element={<ProtectedRoute><AiLearningSession /></ProtectedRoute>} />
            <Route path="/career-coach" element={<ProtectedRoute><CareerCoach /></ProtectedRoute>}/>
            <Route path="/future-self" element={<ProtectedRoute><FutureStory /></ProtectedRoute>} />

            {/* ---------- SHARED ---------- */}
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />

            {/* ---------- TEAM CHAT ---------- */}
            <Route path="/team/:teamId/chat" element={<ProtectedRoute><TeamChat /></ProtectedRoute>} />

            {/* ---------- MENTOR ROUTES ---------- */}
<Route
  path="/mentor/my-mentees"
  element={<ProtectedRoute><MentorRoute><MyMentees /></MentorRoute></ProtectedRoute>}
/>

<Route
  path="/mentor/my-teams"
  element={
    <ProtectedRoute>
      <MentorRoute>
        <MentorMyTeams />
      </MentorRoute>
    </ProtectedRoute>
  }
/>


<Route
  path="/mentor/team/:teamId"
  element={<ProtectedRoute><MentorRoute><MentorTeamView /></MentorRoute></ProtectedRoute>}
/>


<Route
  path="/mentor/research"
  element={<ProtectedRoute><MentorRoute><MentorResearch /></MentorRoute></ProtectedRoute>}
/>

<Route
  path="/mentor/collaboration"
  element={<ProtectedRoute><MentorRoute><MentorCollaboration /></MentorRoute></ProtectedRoute>}
/>  

<Route
  path="/mentor/announcements"
  element={<ProtectedRoute><MentorRoute><MentorAnnouncements /></MentorRoute></ProtectedRoute>}
/>  

<Route
  path="/mentor/plagiarism"
  element={<ProtectedRoute><MentorRoute><MentorPlagiarism /></MentorRoute></ProtectedRoute>}
/>
            {/* ---------- FALLBACK ---------- */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
