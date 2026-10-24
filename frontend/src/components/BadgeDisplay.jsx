const BadgeDisplay = ({ badges }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className="border rounded-lg p-4 shadow hover:shadow-lg transition bg-white relative"
          title={badge.description}
        >
          <div className="text-3xl mb-2">{badge.icon}</div>
          <div className="font-semibold text-lg">{badge.name}</div>
          <div className="text-sm text-gray-600 mb-1">{badge.description}</div>
          <div className="flex justify-between text-xs mb-1">
            <span>Progress:</span>
            <span>{badge.progress}/{badge.goal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(badge.progress / badge.goal) * 100}%` }}
            ></div>
          </div>
          <div className="text-right font-medium text-blue-600">{badge.points} pts</div>
        </div>
      ))}
    </div>
  );
};

export default BadgeDisplay;
