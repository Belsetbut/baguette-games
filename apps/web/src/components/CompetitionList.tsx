
import { useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";

export default function CompetitionList() {
  const competitions = useQuery(api.competitions.list);
  return (
    <div className="grid gap-4 p-4">
      {competitions?.map((comp) => (
        <a
          key={comp.id}
          href={`/competition/${comp.id}` as `/competition/${string}`}
          className="block rounded-lg border bg-gray-700 p-4 shadow hover:bg-gray-600 transition"
        >
          <h3 className="text-lg font-semibold">{comp.name}</h3>
        </a>
      ))}
    </div>
  );
}
