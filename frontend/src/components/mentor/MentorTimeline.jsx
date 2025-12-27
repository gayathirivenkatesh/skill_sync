import React from "react";

const EVENT_COLORS = {
  submission: "bg-yellow-200 text-yellow-800",
  review: "bg-green-200 text-green-800",
  session: "bg-blue-200 text-blue-800",
};

const MentorTimeline = ({ events = [] }) => {
  if (events.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {events.slice(-5).map((event) => (
        <li
          key={event._id || `${event.type}-${event.timestamp}`}
          className="flex items-center gap-2"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              EVENT_COLORS[event.type] || "bg-gray-300"
            }`}
          />
          <div className="text-sm text-gray-700">
            <span className="font-medium">{event.title}</span>{" "}
            <span className="text-gray-500 text-xs">
              ({new Date(event.timestamp).toLocaleDateString()})
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MentorTimeline;
