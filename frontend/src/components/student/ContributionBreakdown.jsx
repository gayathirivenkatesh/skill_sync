const ContributionBreakdown = ({ contributions }) => {
  if (!contributions?.length) return null;

  return (
    <div className="border rounded p-4 mb-6">
      <h3 className="font-bold text-lg mb-2">Team Contributions</h3>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Member</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((c, i) => (
            <tr key={i}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.role}</td>
              <td className="border p-2">{c.work}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContributionBreakdown;
