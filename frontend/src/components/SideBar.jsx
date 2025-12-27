import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiZap,
  FiAward,
  FiBarChart2,
  FiMessageCircle,
  FiGitBranch,
  FiBookOpen,
  FiTrendingUp,
  FiGlobe,
  FiLayers,
  FiAlertCircle,
  FiCpu,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);

  const role = user?.role || localStorage.getItem("role");
  if (loading || !role) return null;

  /* ---------------- STUDENT LINKS ---------------- */
  const studentLinks = {
    Core: [{ name: "Dashboard", path: "/dashboard", icon: <FiHome /> }],
    "Skills & Matching": [
      { name: "Skill Mapper", path: "/skill-mapper", icon: <FiGitBranch /> },
      { name: "Team Builder", path: "/team-builder", icon: <FiUsers /> },
      { name: "Innovation Lab", path: "/innovation-lab", icon: <FiZap /> },
      { name: "Role Simulator", path: "/role-simulator", icon: <FiCpu /> },
    ],
    Learning: [
      { name: "Learning Hub", path: "/learning-hub", icon: <FiBookOpen /> },
      { name: "Skill Gaps", path: "/learning/skill-gaps", icon: <FiAlertCircle /> },
    ],
    Engagement: [
      { name: "Gamification", path: "/gamification", icon: <FiAward /> },
      { name: "Career Coach", path: "/career-coach", icon: <FiBarChart2 /> },
      { name: "AI Skill Arena", path: "/ai-skill-arena", icon: <FiMessageCircle /> },
      { name: "Community", path: "/community", icon: <FiGlobe /> },
    ],
    "Growth & Vision": [
      { name: "Future Self Simulator", path: "/future-self", icon: <FiTrendingUp /> },
    ],
  };

  /* ---------------- MENTOR LINKS ---------------- */
  const mentorLinks = {
    Core: [{ name: "Dashboard", path: "/dashboard/mentor", icon: <FiHome /> }],
    Mentoring: [
      { name: "My Mentees", path: "/mentor/my-mentees", icon: <FiUsers /> },
      { name: "My Teams", path: "/mentor/my-teams", icon: <FiLayers /> },
    ],
    "Mentor Benefits": [
      { name: "Research & Insights", path: "/mentor/research", icon: <FiBookOpen /> },
      { name: "Mentor Collaboration", path: "/mentor/collaboration", icon: <FiUsers /> },
    ],
    Engagement: [
      { name: "Community", path: "/community", icon: <FiGlobe /> },
      { name: "Announcements", path: "/mentor/announcements", icon: <FiZap /> },
    ],
  };

  const sections = role === "mentor" ? mentorLinks : studentLinks;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  /* 🎨 ROLE-BASED THEMES */
  const theme =
    role === "mentor"
      ? {
          sidebar: "bg-gradient-to-b from-emerald-900 to-teal-900",
          active: "bg-emerald-600 text-white",
          hover: "hover:bg-emerald-800",
          text: "text-emerald-100",
          section: "text-emerald-300",
          brand: "text-emerald-200",
        }
      : {
        sidebar: "bg-gradient-to-b from-amber-50 to-orange-100 border-r border-orange-200",
        active: "bg-orange-200 text-orange-900 font-semibold border-r-4 border-orange-500",
        hover: "hover:bg-orange-100",
        text: "text-slate-800",
        section: "text-orange-700 uppercase tracking-wide",
        brand: "text-orange-800",
        };

  const renderLinks = (links) =>
    links.map((link) => (
      <Link
        key={link.path}
        to={link.path}
        className={`
          flex items-center gap-3 py-2 px-3 rounded-md
          transition-colors text-sm
          ${isActive(link.path) ? theme.active : `${theme.text} ${theme.hover}`}
        `}
      >
        {link.icon}
        {link.name}
      </Link>
    ));

  return (
    <aside className={`w-64 h-screen flex flex-col ${theme.sidebar}`}>
      <div className="p-4 overflow-y-auto flex-1 pb-12">
        <h1 className={`text-2xl font-bold mb-8 ${theme.brand}`}>
          SkillSync
        </h1>

        {Object.entries(sections).map(([section, links]) => (
          <div key={section} className="mb-6">
            <p className={`text-xs uppercase tracking-wider mb-2 ${theme.section}`}>
              {section}
            </p>
            <div className="flex flex-col gap-1">
              {renderLinks(links)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
