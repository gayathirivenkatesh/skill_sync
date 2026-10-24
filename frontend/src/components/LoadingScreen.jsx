const LoadingScreen = ({ message = "Loading…" }) => (
  <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
    <p className="text-sm text-slate-600" role="status">
      {message}
    </p>
  </div>
);

export default LoadingScreen;
