"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LiveEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id });
  const athletes = useQuery(api.athletes.getAthletesByCompetition, { competitionId: id });
  const activeAthlete = athletes?.find(athlete => athlete.isActive);

  // Local UI state for showing attempt feedback card for 5 seconds
  const [lastRecordedAttempt, setLastRecordedAttempt] = useState<{
    athleteId: string;
    athleteName: string;
    height: number;
    result: string;
    timestamp: number;
  } | null>(null);
  // Feedback card fade state (must be top-level)
  const [closingFeedback, setClosingFeedback] = useState(false);
  
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

  // Helpers to detect existing attempt states for an athlete at the current height
  const getAttemptResultsForHeight = (athlete: any, height: number) => {
    if (!athlete?.attempts) return [] as string[];
    return athlete.attempts
      .filter((a: any) => a.height === height)
      .sort((a: any, b: any) => a.attemptNumber - b.attemptNumber)
      .map((a: any) => a.result);
  };

  const hasClearedHeight = (athlete: any, height: number) =>
    getAttemptResultsForHeight(athlete, height).includes("O");
  const hasSkippedHeight = (athlete: any, height: number) =>
    getAttemptResultsForHeight(athlete, height).includes("-");

  const handleSetActiveAthlete = async (athleteId: string) => {
    if (!competition?.currentHeight) return;
    const athlete = athletes?.find(a => a.id === athleteId);
    if (!athlete) return;
    // Prevent selecting athlete who has cleared or skipped this height already
    if (hasClearedHeight(athlete, competition.currentHeight) || hasSkippedHeight(athlete, competition.currentHeight)) return;
    await setActiveAthlete({ id: athleteId, competitionId: id });
  };

  const handleRecordAttempt = async (result: string) => {
    if (!activeAthlete || !competition?.currentHeight) return;
    // Disallow new attempts if already cleared or skipped
    if (hasClearedHeight(activeAthlete, competition.currentHeight) || hasSkippedHeight(activeAthlete, competition.currentHeight)) return;
    await recordAttempt({
      id: activeAthlete.id,
      height: competition.currentHeight,
      result,
    });
    // Show attempt feedback card
    setLastRecordedAttempt({
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      height: competition.currentHeight,
      result,
      timestamp: Date.now(),
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

  // Helper function kept for existing table rendering
  const getAttemptResults = (athlete: any, height: number) => getAttemptResultsForHeight(athlete, height);

  // Auto-hide feedback card after 5 seconds
  useEffect(() => {
    if (!lastRecordedAttempt) return;
    const timer = setTimeout(() => {
      setLastRecordedAttempt(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastRecordedAttempt]);

  const currentHeight = competition?.currentHeight;

  // Precompute attempt constraints for rendering (memoized for perf)
  const attemptStateMap = useMemo(() => {
    if (!athletes || !currentHeight) return new Map<string, { cleared: boolean; skipped: boolean }>();
    return new Map(
      athletes.map(a => [
        a.id,
        {
          cleared: hasClearedHeight(a, currentHeight),
          skipped: hasSkippedHeight(a, currentHeight),
        },
      ])
    );
  }, [athletes, currentHeight]);

  if (!competition || !athletes) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
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

      {lastRecordedAttempt && (
        <Card className="border-4 border-primary shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl font-bold">
              Attempt Result
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-lg"><span className="font-semibold">Athlete:</span> {lastRecordedAttempt.athleteName}</p>
              <p className="text-lg"><span className="font-semibold">Height:</span> {lastRecordedAttempt.height.toFixed(2)}m</p>
              <p className="text-lg"><span className="font-semibold">Result:</span> <ResultBadge result={lastRecordedAttempt.result} /></p>
              <p className="text-sm text-muted-foreground">Hiding in 5s...</p>
            </div>
            <div className="flex items-center gap-4">
              {getAttemptResults(
                athletes.find(a => a.id === lastRecordedAttempt.athleteId),
                lastRecordedAttempt.height
              ).map((r: string, i: number) => (
                <AttemptPill key={i} result={r} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    disabled={!competition.currentHeight || hasClearedHeight(activeAthlete, competition.currentHeight) || hasSkippedHeight(activeAthlete, competition.currentHeight)}
                  >
                    Pass (O)
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700" 
                    onClick={() => handleRecordAttempt("X")}
                    disabled={!competition.currentHeight || hasClearedHeight(activeAthlete, competition.currentHeight) || hasSkippedHeight(activeAthlete, competition.currentHeight)}
                  >
                    Fail (X)
                  </Button>
                  <Button 
                    className="bg-gray-600 hover:bg-gray-700" 
                    onClick={() => handleRecordAttempt("-")}
                    disabled={!competition.currentHeight || hasClearedHeight(activeAthlete, competition.currentHeight) || hasSkippedHeight(activeAthlete, competition.currentHeight)}
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
                {athletes.map((athlete) => {
                  const state = attemptStateMap.get(athlete.id);
                  const cleared = state?.cleared;
                  const skipped = state?.skipped;
                  return (
                  <TableRow key={athlete.id} className={athlete.isOut ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{athlete.name}</TableCell>
                    <TableCell>{athlete.PB}m</TableCell>
                    <TableCell>
                      {athlete.isOut ? "Out" : athlete.isActive ? "Active" : cleared ? "Cleared" : skipped ? "Skipped" : "Waiting"}
                    </TableCell>
                    <TableCell>
                      {competition.currentHeight && 
                        getAttemptResults(athlete, competition.currentHeight).join(" ")}
                    </TableCell>
                    <TableCell>
                      <Button 
                        disabled={athlete.isOut || athlete.isActive || !competition.currentHeight || cleared || skipped}
                        onClick={() => handleSetActiveAthlete(athlete.id)}
                      >
                        Set Active
                      </Button>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Small visual pill for past attempts in feedback card
function AttemptPill({ result }: { result: string }) {
  const base = "w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold border-2";
  if (result === "O") return <span className={base + " bg-green-600 text-white border-green-400"}>O</span>;
  if (result === "X") return <span className={base + " bg-red-600 text-white border-red-400"}>X</span>;
  if (result === "-") return <span className={base + " bg-gray-500 text-white border-gray-300"}>-</span>;
  return <span className={base}>{result}</span>;
}

function ResultBadge({ result }: { result: string }) {
  const styles = result === "O"
    ? "bg-green-600 text-white"
    : result === "X"
      ? "bg-red-600 text-white"
      : "bg-gray-600 text-white";
  return <span className={"inline-block px-3 py-1 rounded font-semibold " + styles}>{result}</span>;
}