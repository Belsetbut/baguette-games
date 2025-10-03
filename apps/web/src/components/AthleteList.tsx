import { useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";

interface AthleteListProps {
  competitionId?: string;
}

export default function AthleteList({ competitionId }: AthleteListProps) {
  const athletes = useQuery(api.athletes.list);
  
  // Filter athletes by competition if competitionId is provided
  const filteredAthletes = competitionId 
    ? athletes?.filter(athlete => athlete.competitionId === competitionId)
    : athletes;

  return (
    <div className="grid gap-4 p-4 w-full">
      {filteredAthletes?.map((athlete) => (
        <a
          key={athlete.id}
          href={`/athlete/${athlete.id}` as `/athlete/${string}`}
          className="block border-white p-4 shadow transition border-b w-full"
        >
          <h3 className=" font-semibold">{athlete.name}</h3>
        </a>
      ))}
      {filteredAthletes?.length === 0 && (
        <p className="text-center text-gray-400">No athletes found</p>
      )}
    </div>
  );
}