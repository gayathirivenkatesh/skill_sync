import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

const NotFound = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          That link does not match an existing page in SkillSync.
        </p>
        <Link
          to={user ? "/dashboard" : "/login"}
          className="btn-primary mt-6 inline-flex"
        >
          {user ? "Back to dashboard" : "Go to login"}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
