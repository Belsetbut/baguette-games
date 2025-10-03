"use client";

import { useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompetitionPage() {
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getCompetition, { id });

  if (!competition) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{competition.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Competition ID: {competition.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}