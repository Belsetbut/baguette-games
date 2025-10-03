"use client";

import { useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompetitionPage() {
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id }); 

  if (!competition) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-end">
      <Button className="m-3 flex">Open Leaderboard</Button>
      </div>
      <h2 className="text-2xl flex justify-center">{competition.name.toUpperCase()}</h2>
    </div>
  );
}