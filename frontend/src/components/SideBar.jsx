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
  FiAlertTriangle,
  FiCalendar,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useLayout } from "../layouts/MainLayout";

const Sidebar = () => {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  const { sidebarOpen, setSidebarOpen } = useLayout();

  const role = user?.role || localStorage.getItem("role");
  if (loading || !role) return null;

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

  const mentorLinks = {
    Core: [{ name: "Dashboard", path: "/dashboard", icon: <FiHome /> }],
    Mentoring: [
      { name: "My Mentees", path: "/mentor/my-mentees", icon: <FiUsers /> },
      { name: "My Teams", path: "/mentor/my-teams", icon: <FiLayers /> },
      { name: "Sessions", path: "/mentor/sessions", icon: <FiCalendar /> },
    ],
    "Mentor Benefits": [
      { name: "Research & Insights", path: "/mentor/research", icon: <FiBookOpen /> },
      { name: "Mentor Collaboration", path: "/mentor/collaboration", icon: <FiUsers /> },
    ],
    Engagement: [
      { name: "Community", path: "/community", icon: <FiGlobe /> },
      { name: "Announcements", path: "/mentor/announcements", icon: <FiZap /> },
      { name: "Plagiarism Alerts", path: "/mentor/plagiarism", icon: <FiAlertTriangle /> },
    ],
  };

  const sections = role === "mentor" ? mentorLinks : studentLinks;

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
    }
    if (path === "/team-builder" && location.pathname.startsWith("/student/team/")) {
      return true;
    }
    if (path === "/mentor/my-teams" && location.pathname.startsWith("/mentor/team/")) {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
        onClick={() => setSidebarOpen(false)}
        className={`
          flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
          ${isActive(link.path) ? theme.active : `${theme.text} ${theme.hover}`}
        `}
        aria-current={isActive(link.path) ? "page" : undefined}
      >
        <span aria-hidden="true">{link.icon}</span>
        {link.name}
      </Link>
    ));

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col transition-transform duration-200
          md:static md:translate-x-0
          ${theme.sidebar}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-12">
          <h1 className={`mb-8 text-2xl font-bold ${theme.brand}`}>SkillSync</h1>

          {Object.entries(sections).map(([section, links]) => (
            <div key={section} className="mb-6">
              <p className={`mb-2 text-xs uppercase tracking-wider ${theme.section}`}>
                {section}
              </p>
              <nav className="flex flex-col gap-1">{renderLinks(links)}</nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
