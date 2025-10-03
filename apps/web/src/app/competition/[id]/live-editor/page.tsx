"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LiveEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id });
  const athletes = useQuery(api.athletes.getAthletesByCompetition, { competitionId: id });
  const activeAthlete = athletes?.find(athlete => athlete.isActive);
  
  const [newHeight, setNewHeight] = useState("");
  const [timerDurationInput, setTimerDurationInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  
  const setCurrentHeight = useMutation(api.competitions.setCurrentHeight);
  const setActiveAthlete = useMutation(api.athletes.setActiveAthlete);
  const recordAttempt = useMutation(api.athletes.recordAttempt);
  const setTimerDuration = useMutation(api.competitions.setTimerDuration);
  const startTimer = useMutation(api.competitions.startTimer);
  const stopTimer = useMutation(api.competitions.stopTimer);

  // Update timer countdown
  useEffect(() => {
    if (!competition?.timerActive || !competition?.timerEndTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = competition.timerEndTime;
      const remaining = endTime ? Math.max(0, Math.floor((endTime - now) / 1000)) : 0;
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [competition?.timerActive, competition?.timerEndTime]);

  const handleSetHeight = async () => {
    if (!newHeight || isNaN(Number(newHeight))) return;
    await setCurrentHeight({ id, height: Number(newHeight) });
    setNewHeight("");
  };

  const handleSetActiveAthlete = async (athleteId: string) => {
    await setActiveAthlete({ id: athleteId, competitionId: id });
  };

  const handleRecordAttempt = async (result: string) => {
    if (!activeAthlete || !competition?.currentHeight) return;
    await recordAttempt({ 
      id: activeAthlete.id, 
      height: competition.currentHeight,
      result 
    });
  };

  const handleSetTimerDuration = async () => {
    if (!timerDurationInput || isNaN(Number(timerDurationInput))) return;
    await setTimerDuration({ id, duration: Number(timerDurationInput) });
    setTimerDurationInput("");
  };

  const handleStartTimer = async () => {
    await startTimer({ id });
  };

  const handleStopTimer = async () => {
    await stopTimer({ id });
  };

  // Helper function to get attempt results for a specific height
  const getAttemptResults = (athlete: any, height: number) => {
    if (!athlete.attempts) return [];
    return athlete.attempts
      .filter((a: any) => a.height === height)
      .sort((a: any, b: any) => a.attemptNumber - b.attemptNumber)
      .map((a: any) => a.result);
  };

  if (!competition || !athletes) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{competition.name.toUpperCase()} - Live Editor</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/competition/${id}`)}>
            Back to Competition
          </Button>
          <Button onClick={() => router.push(`/competition/${id}/leaderboard`)}>
            Open Leaderboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Height Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Current Height</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center mb-4">
              {competition.currentHeight?.toFixed(2) || "2.00"}m
            </div>
            <div className="flex gap-2">
              <Input 
                type="number" 
                step="0.01" 
                placeholder="New height" 
                value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
              />
              <Button onClick={handleSetHeight}>Set</Button>
            </div>
          </CardContent>
        </Card>

        {/* Timer Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center mb-4">
              {competition.timerActive ? timeLeft : competition.timerDuration || 60}s
            </div>
            <div className="flex gap-2 mb-4">
              <Input 
                type="number" 
                placeholder="Duration (seconds)" 
                value={timerDurationInput}
                onChange={(e) => setTimerDurationInput(e.target.value)}
              />
              <Button onClick={handleSetTimerDuration}>Set</Button>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={handleStartTimer}
                disabled={competition.timerActive}
              >
                Start
              </Button>
              <Button 
                className="flex-1"
                onClick={handleStopTimer}
                disabled={!competition.timerActive}
              >
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Athlete Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Current Athlete</CardTitle>
          </CardHeader>
          <CardContent>
            {activeAthlete ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">{activeAthlete.name}</h2>
                <div className="flex gap-2 mb-4">
                  <p>PB: {activeAthlete.PB}m</p>
                  <p>Highest Cleared: {activeAthlete.highestHeightPassed || "None"}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleRecordAttempt("O")}
                  >
                    Pass (O)
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700" 
                    onClick={() => handleRecordAttempt("X")}
                  >
                    Fail (X)
                  </Button>
                  <Button 
                    className="bg-gray-600 hover:bg-gray-700" 
                    onClick={() => handleRecordAttempt("-")}
                  >
                    Pass (-)
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center">No athlete selected</p>
            )}
          </CardContent>
        </Card>

        {/* Athletes List Section */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Athletes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>PB</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Height Attempts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => (
                  <TableRow key={athlete.id} className={athlete.isOut ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{athlete.name}</TableCell>
                    <TableCell>{athlete.PB}m</TableCell>
                    <TableCell>
                      {athlete.isOut ? "Out" : athlete.isActive ? "Active" : "Waiting"}
                    </TableCell>
                    <TableCell>
                      {competition.currentHeight && 
                        getAttemptResults(athlete, competition.currentHeight).join(" ")}
                    </TableCell>
                    <TableCell>
                      <Button 
                        disabled={athlete.isOut || athlete.isActive}
                        onClick={() => handleSetActiveAthlete(athlete.id)}
                      >
                        Set Active
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}