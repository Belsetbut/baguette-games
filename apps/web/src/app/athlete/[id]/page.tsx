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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CompetitionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const athlete = useQuery(api.athletes.getById, { id }); 
  const deleteAthlete = useMutation(api.athletes.deleteAthlete);

  const removeAthlete = async () => {
    if (!athlete) return;
    await deleteAthlete({ id: athlete._id });
    router.push(`/competition/${athlete.competitionId}`);
  };

  if (!athlete) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading athlete...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl flex justify-center mt-5 text-bold">{athlete.name}</h2>
      <div className="flex mt-2 justify-center">
        <div className="w-1/3 border rounded-2xl p-4">
          <h3 className="text-xl font-semibold mb-4">Personal Best</h3>
          <div className="p-4">
            <p className="text-3xl font-bold text-center">{athlete.PB}m</p>
        </div>
      </div>
    </div>
    <div className="flex justify-center mt-15">
        <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="mt-4 bg-white text-red-700 hover:bg-red-700 hover:text-white duration-400">Delete Athlete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this Athlete from our servers. This action <strong className="text-red-400 underline">cannot</strong> be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={removeAthlete}>I am sure</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
    </div>
  );
}