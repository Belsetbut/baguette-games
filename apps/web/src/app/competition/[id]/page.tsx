"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AthleteList from "@/components/AthleteList";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function CompetitionPage() {
  const router = useRouter();
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthletePB, setNewAthletePB] = useState(0);
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id }); 
  const createAthlete = useMutation(api.athletes.create);

   const handleSubmit = async () => {
    if (newAthleteName.length === 0) {
      return;
    }
    console.log("new athlete: " + newAthleteName);
        await createAthlete({ name: newAthleteName, id: newAthleteName.replace(/ /g, ''), competitionId: id, PB: Number(newAthletePB) });
        setNewAthleteName("");
        setNewAthletePB(0);
    }

  if (!competition) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button className="m-3 flex">Open Leaderboard</Button>
      </div>
      <h2 className="text-2xl flex justify-center">{competition.name.toUpperCase()}</h2>
      
      <h3 className="text-2xl flex justify-start ml-6 mt-5">Athletes:</h3>
      
      <div className="flex flex-row gap-4 mx-5 mt-2">
        <div className="w-2xl">
        <div className="flex-1 border scroll-auto rounded-2xl relative">
          <Dialog>
            <form>
              <DialogTrigger asChild>
                <Button 
                className="m-5 border bg-background shadow-xs hover:bg-accent hover:text-shadow-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-accent-foreground absolute top-0 right-0"
                >
                Athlete +
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Create Athlete</DialogTitle>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="name-1">Name</Label>
                    <Input id="name-1" name="name" placeholder="Rick Astley" onChange={(e) => setNewAthleteName(e.target.value)}/>
                    <Label htmlFor="PB-1">PB</Label>
                    <Input id="PB-1" name="PB" placeholder="2.05" onChange={(e) => setNewAthletePB(Number(e.target.value))}/>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" onClick={handleSubmit}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
          <AthleteList competitionId={id} />
        </div>
</div>
        
        {/* Current Height section */}
        <div className="w-1/3 border rounded-2xl p-4">
          <h3 className="text-xl font-semibold mb-4">Start Height</h3>
          <div className="p-4">
            {/* Add your current height content here */}
            <p className="text-3xl font-bold text-center">2.05m</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-10">
        <Button onClick={() => router.push(`/competition/${id}/live-editor`)}>
          Start Competition
        </Button>
      </div>
    </div>
  );
}
