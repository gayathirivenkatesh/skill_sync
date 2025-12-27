const CodeAndDemo = ({ meta }) => {
  if (!meta) return null;

  return (
    <div className="border rounded p-4 mb-6">
      <h3 className="font-bold text-lg mb-2">Code & Demo</h3>

      {meta.github_repo && (
        <p>
          <b>GitHub:</b>{" "}
          <a
            href={meta.github_repo}
            target="_blank"
            className="text-blue-600 underline"
          >
            View Repository
          </a>
        </p>
      )}

      {meta.live_url && (
        <p>
          <b>Live Demo:</b>{" "}
          <a
            href={meta.live_url}
            target="_blank"
            className="text-blue-600 underline"
          >
            Open Demo
          </a>
        </p>
      )}

      {meta.api_docs && (
        <p>
          <b>API Docs:</b>{" "}
          <a
            href={meta.api_docs}
            target="_blank"
            className="text-blue-600 underline"
          >
            View Docs
          </a>
        </p>
      )}
    </div>
  );
};

export default CodeAndDemo;
