"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
  // Sorting state
  const [sortMode, setSortMode] = useState<'default' | 'name' | 'added'>('default');

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Large, highly visible attempt indicator circle
function AttemptCircle({ result }: { result: string | null }) {
  const base = "w-14 h-14 flex items-center justify-center rounded-full text-3xl font-bold select-none border-2";
  if (!result) return <span className={cn(base, "opacity-30 border-muted-foreground/30")}>-</span>;
  if (result === "O") return <span className={cn(base, "bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-500/40")}>O</span>;
  if (result === "X") return <span className={cn(base, "bg-red-600 text-white border-red-300 shadow-lg shadow-red-600/40")}>X</span>;
  return <span className={cn(base, "bg-zinc-500 text-white border-zinc-300")}>{result}</span>;
}

export default function LeaderboardPage() {
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id });
  const athletesRaw = useQuery(api.athletes.getAthletesByCompetition, { competitionId: id });
  // Add fallback for missing createdAt (simulate with index if not present)
  const athletes = useMemo(() => {
    if (!athletesRaw) return [];
    let arr = [...athletesRaw];
    if (sortMode === 'name') {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'added') {
      // Use _creationTime (Convex system field)
      arr.sort((a, b) => {
        if (a._creationTime && b._creationTime) return a._creationTime - b._creationTime;
        return 0;
      });
    }
    // Default: keep backend sort (by height, then attempts)
    return arr;
  }, [athletesRaw, sortMode]);
  const activeAthlete = athletes?.find(a => a.isActive);
  const clearActiveAthlete = useMutation(api.athletes.clearActiveAthlete);

  // Local display lifecycle control for active card
  const [showActiveCard, setShowActiveCard] = useState(true);
  const [hidingCard, setHidingCard] = useState(false);
  const lastAttemptRef = useRef<{ athleteId: string | null; attemptKey: string | null }>({ athleteId: null, attemptKey: null });

  const [timeLeft, setTimeLeft] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!competition?.timerActive || !competition?.timerEndTime) return;
    const tick = () => {
      const now = Date.now();
      const end = competition.timerEndTime || 0;
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [competition?.timerActive, competition?.timerEndTime]);

  // Helpers
  const getAttemptResults = (athlete: any, height: number) => {
    if (!athlete?.attempts) return [] as string[];
    return athlete.attempts
      .filter((a: any) => a.height === height)
      .sort((a: any, b: any) => a.attemptNumber - b.attemptNumber)
      .map((a: any) => a.result);
  };

  const getLatestAttemptResult = (athlete: any) => {
    if (!athlete?.attempts || athlete.attempts.length === 0) return null;
    const sorted = [...athlete.attempts].sort((a, b) => {
      if (a.height !== b.height) return b.height - a.height;
      return b.attemptNumber - a.attemptNumber;
    });
    return sorted[0];
  };

  const currentHeight = competition?.currentHeight;

  const activeAthleteAttemptResults = useMemo(() => {
    if (!activeAthlete || !currentHeight) return [] as string[];
    return getAttemptResults(activeAthlete, currentHeight);
  }, [activeAthlete, currentHeight]);

  const lastAttempt = activeAthlete ? getLatestAttemptResult(activeAthlete) : null;
  // Only create a signature when there is at least one attempt at the current height
  const hasAnyAttemptsAtCurrent = !!(activeAthlete && currentHeight && activeAthlete.attempts?.some((a: any) => a.height === currentHeight));
  const lastAttemptSignature = activeAthlete && lastAttempt && hasAnyAttemptsAtCurrent
    ? `${activeAthlete.id}:${lastAttempt.height}:${lastAttempt.attemptNumber}:${lastAttempt.result}`
    : null;

  // Effect: when an athlete becomes inactive (cleared from backend) reset UI state
  useEffect(() => {
    if (!activeAthlete) {
      setShowActiveCard(false);
      setHidingCard(false);
    } else {
      // If new athlete selected show card again
      if (lastAttemptRef.current.athleteId !== activeAthlete.id) {
        setShowActiveCard(true);
        setHidingCard(false);
      }
    }
  }, [activeAthlete]);

  // Effect: detect new attempt and start hide timer
  useEffect(() => {
    if (!activeAthlete) return;
    // If no attempts yet: keep card visible and do nothing.
    if (!lastAttemptSignature) return;
    if (lastAttemptRef.current.attemptKey === lastAttemptSignature) return; // no change
    // New attempt arrived -> start timers
    lastAttemptRef.current.athleteId = activeAthlete.id;
    lastAttemptRef.current.attemptKey = lastAttemptSignature;
    setShowActiveCard(true);
    setHidingCard(false);
    const fadeTimer = setTimeout(() => setHidingCard(true), 4500);
    const hideTimer = setTimeout(async () => {
      setShowActiveCard(false);
      if (activeAthlete.isActive) {
        try { await clearActiveAthlete({ competitionId: id }); } catch {}
      }
    }, 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [lastAttemptSignature, activeAthlete, clearActiveAthlete, id]);
  const attemptsUsed = activeAthleteAttemptResults.length;
  const attemptsRemaining = 3 - attemptsUsed;

  if (!competition || !athletes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-lg animate-pulse">Loading competition data...</p>
      </div>
    );
  }

  const formattedHeight = (h: number | undefined | null) =>
    h != null ? h.toFixed(2) + "m" : "-";

  // Time display coloring for urgency
  const displayTime = competition.timerActive ? timeLeft : competition.timerDuration || 60;
  const timeClass = cn(
    "font-mono font-bold tracking-tight transition-colors",
    displayTime <= 5 ? "text-red-600 animate-pulse" : displayTime <= 15 ? "text-amber-500" : "text-foreground"
  );

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
        {/* Header */}
        <header className="mb-6 md:mb-10 text-center">
          <h1 className="font-bold uppercase tracking-wide text-[clamp(2rem,4vw,4.5rem)] leading-none drop-shadow-sm">
            {competition.name}
          </h1>
          <p className="mt-3 text-lg md:text-2xl font-semibold">
            Current Height: <span className="text-primary text-2xl md:text-4xl font-extrabold ml-2">{formattedHeight(currentHeight)}</span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 items-center">
            <span className="font-medium">Sort by:</span>
            <button
              className={cn("px-3 py-1 rounded border", sortMode === 'default' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted')}
              onClick={() => setSortMode('default')}
            >Default</button>
            <button
              className={cn("px-3 py-1 rounded border", sortMode === 'name' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted')}
              onClick={() => setSortMode('name')}
            >Name</button>
            <button
              className={cn("px-3 py-1 rounded border", sortMode === 'added' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted')}
              onClick={() => setSortMode('added')}
            >Added</button>
          </div>
        </header>

        {/* Active Attempt Full Width Card */}
        {activeAthlete && showActiveCard && (
          <Card className={cn(
            "mb-10 border-4 shadow-xl relative overflow-hidden transition-all duration-500",
            hidingCard ? "opacity-0 -translate-y-4" : "opacity-100",
            "bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/15 dark:via-background dark:to-background"
          )}>
            <CardHeader className="pb-0">
              <CardTitle className="w-full text-center text-[clamp(2rem,5vw,5.5rem)] font-extrabold tracking-tight">
                {activeAthlete.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-6 md:gap-10 grid-cols-2 md:grid-cols-4 items-center">
                <div className="col-span-2 flex flex-col items-center justify-center">
                  <span className="text-muted-foreground text-xl md:text-2xl font-medium uppercase tracking-wide">Height</span>
                  <span className="mt-2 text-[clamp(3rem,8vw,8rem)] font-extrabold leading-none drop-shadow-sm">
                    {formattedHeight(currentHeight)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-muted-foreground text-xl md:text-2xl font-medium uppercase tracking-wide">Time</span>
                  <span className={cn("mt-2 text-[clamp(2.5rem,7vw,6rem)]", timeClass)}>{displayTime}s</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-muted-foreground text-xl md:text-2xl font-medium uppercase tracking-wide">Attempts</span>
                  <div className="mt-2 flex gap-4">
                    {activeAthleteAttemptResults.map((r: string, i: number) => (
                      <AttemptCircle key={i} result={r} />
                    ))}
                    {Array.from({ length: attemptsRemaining }).map((_, i) => (
                      <AttemptCircle key={"empty-" + i} result={null} />
                    ))}
                  </div>
                  <span className="mt-2 text-lg font-medium text-muted-foreground">
                    {attemptsUsed}/3 used
                  </span>
                </div>
                <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <InfoStat label="PB" value={formattedHeight(activeAthlete.PB)} />
                  <InfoStat label="Best Today" value={formattedHeight(activeAthlete.highestHeightPassed)} />
                  <InfoStat label="Last Attempt" value={lastAttempt?.result || "-"} tone={lastAttempt?.result} />
                  <InfoStat label="Total Attempts" value={activeAthlete.totalAttempts ?? 0} />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30" />
          </Card>
        )}

        <div className="grid gap-8 md:gap-10 grid-cols-1 xl:grid-cols-3">
          {/* Left Column: Current Athlete (compact) & Timer (for when full card may scroll off on smaller screens) */}
            <div className="space-y-8 xl:col-span-1 order-2 xl:order-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-bold tracking-wide">Current Athlete</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeAthlete ? (
                    <div className="text-center space-y-4">
                      <div>
                        <p className="text-3xl font-extrabold tracking-tight">{activeAthlete.name}</p>
                        <p className="text-muted-foreground text-lg">PB {formattedHeight(activeAthlete.PB)}</p>
                      </div>
                      {currentHeight && (
                        <div className="flex justify-center gap-3 md:gap-4">
                          {activeAthleteAttemptResults.map((r: string, i: number) => (
                            <AttemptCircle key={i} result={r} />
                          ))}
                          {Array.from({ length: attemptsRemaining }).map((_, i) => (
                            <AttemptCircle key={"mini-empty-" + i} result={null} />
                          ))}
                        </div>
                      )}
                      {lastAttempt && (
                        <p className="text-lg font-medium">
                          Last: <span className={cn(
                            "px-3 py-1 rounded-md font-bold",
                            lastAttempt.result === "O" ? "bg-emerald-500 text-white" : lastAttempt.result === "X" ? "bg-red-600 text-white" : "bg-muted"
                          )}>{lastAttempt.result}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-lg">No athlete selected</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-bold tracking-wide">Timer</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <span className={cn("text-[4rem] font-extrabold leading-none", timeClass)}>{displayTime}s</span>
                </CardContent>
              </Card>
            </div>

          {/* Leaderboard */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-3xl font-bold tracking-wide">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border bg-muted/10">
                  <table className="w-full text-lg md:text-xl">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="py-3 px-3">Rank</th>
                        <th className="py-3 px-3">Athlete</th>
                        <th className="py-3 px-3 text-center">Best</th>
                        <th className="py-3 px-3 text-center">Attempts</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {athletes.map((athlete, index) => {
                        const rowActive = athlete.isActive;
                        return (
                          <tr
                            key={athlete.id}
                            className={cn(
                              "border-t border-border/50 transition-colors", 
                              rowActive && "bg-primary/10 dark:bg-primary/15",
                              athlete.isOut && "opacity-60"
                            )}
                          >
                            <td className="py-3 px-3 font-extrabold tabular-nums">{index + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-xl leading-tight">{athlete.name}</div>
                              <div className="text-xs md:text-sm text-muted-foreground">PB {formattedHeight(athlete.PB)}</div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{formattedHeight(athlete.highestHeightPassed)}</td>
                            <td className="py-3 px-3 text-center font-medium">{athlete.totalAttempts || 0}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={cn(
                                "inline-flex min-w-[5.5rem] justify-center rounded-md px-3 py-1 text-sm font-semibold tracking-wide",
                                athlete.isOut
                                  ? "bg-red-600 text-white"
                                  : rowActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                              )}>
                                {athlete.isOut ? "Out" : rowActive ? "Active" : "Waiting"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoStat({ label, value, tone }: { label: string; value: any; tone?: string }) {
  const toneClasses = tone === "O" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : tone === "X" ? "bg-red-600/20 text-red-400 border-red-600/40" : "bg-muted text-foreground";
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border px-4 py-3 md:py-5 text-center gap-1", tone ? toneClasses : "bg-muted/40")}>      
      <span className="text-xs md:text-sm uppercase tracking-wide font-medium text-muted-foreground">{label}</span>
      <span className="text-xl md:text-3xl font-extrabold leading-none">{value}</span>
    </div>
  );
}