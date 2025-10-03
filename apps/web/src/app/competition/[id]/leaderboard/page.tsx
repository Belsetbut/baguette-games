"use client";

import { useQuery } from "convex/react";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function LeaderboardPage() {
  const params = useParams();
  const id = params.id as string;
  const competition = useQuery(api.competitions.getById, { id });
  const athletes = useQuery(api.athletes.getAthletesByCompetition, { competitionId: id });
  const activeAthlete = athletes?.find(athlete => athlete.isActive);
  
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Update timer countdown
  useEffect(() => {
    if (!competition?.timerActive || !competition?.timerEndTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = competition.timerEndTime;
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [competition?.timerActive, competition?.timerEndTime]);

  // Helper function to get attempt results for a specific height
  const getAttemptResults = (athlete: any, height: number) => {
    if (!athlete?.attempts) return [];
    return athlete.attempts
      .filter((a: any) => a.height === height)
      .sort((a: any, b: any) => a.attemptNumber - b.attemptNumber)
      .map((a: any) => a.result);
  };

  // Helper function to get the latest attempt result
  const getLatestAttemptResult = (athlete: any) => {
    if (!athlete?.attempts || athlete.attempts.length === 0) return null;
    
    const sortedAttempts = [...athlete.attempts].sort((a, b) => {
      if (a.height !== b.height) return b.height - a.height;
      return b.attemptNumber - a.attemptNumber;
    });
    
    return sortedAttempts[0];
  };

  if (!competition || !athletes) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading competition data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{competition.name.toUpperCase()}</h1>
          <div className="text-2xl font-semibold">Current Height: {competition.currentHeight?.toFixed(2) || "2.00"}m</div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Athlete and Timer Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Current Athlete</h2>
              {activeAthlete ? (
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{activeAthlete.name}</div>
                  <div className="text-xl mb-4">PB: {activeAthlete.PB}m</div>
                  
                  {competition.currentHeight && (
                    <div className="flex justify-center gap-2 text-2xl">
                      {getAttemptResults(activeAthlete, competition.currentHeight).map((result, index) => (
                        <span key={index} className={`
                          w-10 h-10 flex items-center justify-center rounded-full
                          ${result === 'O' ? 'bg-green-600' : result === 'X' ? 'bg-red-600' : 'bg-gray-600'}
                        `}>
                          {result}
                        </span>
                      ))}
                      {Array(3 - getAttemptResults(activeAthlete, competition.currentHeight).length).fill(0).map((_, index) => (
                        <span key={index} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700">
                          -
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {getLatestAttemptResult(activeAthlete) && (
                    <div className="mt-4 text-xl">
                      Last attempt: 
                      <span className={`
                        ml-2 px-3 py-1 rounded
                        ${getLatestAttemptResult(activeAthlete).result === 'O' ? 'bg-green-600' : 
                          getLatestAttemptResult(activeAthlete).result === 'X' ? 'bg-red-600' : 'bg-gray-600'}
                      `}>
                        {getLatestAttemptResult(activeAthlete).result}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xl">No athlete selected</div>
              )}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Timer</h2>
              <div className="text-6xl font-bold text-center">
                {competition.timerActive ? timeLeft : competition.timerDuration || 60}
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 text-left">Rank</th>
                      <th className="py-3 text-left">Athlete</th>
                      <th className="py-3 text-center">Height</th>
                      <th className="py-3 text-center">Attempts</th>
                      <th className="py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athletes.map((athlete, index) => (
                      <tr 
                        key={athlete.id} 
                        className={`
                          border-b border-gray-700 
                          ${athlete.isActive ? 'bg-blue-900/30' : ''} 
                          ${athlete.isOut ? 'opacity-60' : ''}
                        `}
                      >
                        <td className="py-3 font-bold">{index + 1}</td>
                        <td className="py-3">
                          <div className="font-semibold">{athlete.name}</div>
                          <div className="text-sm text-gray-400">PB: {athlete.PB}m</div>
                        </td>
                        <td className="py-3 text-center">
                          {athlete.highestHeightPassed ? `${athlete.highestHeightPassed}m` : '-'}
                        </td>
                        <td className="py-3 text-center">
                          {athlete.totalAttempts || 0}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`
                            px-2 py-1 rounded text-sm
                            ${athlete.isOut ? 'bg-red-900/50' : 
                              athlete.isActive ? 'bg-blue-600' : 'bg-gray-700'}
                          `}>
                            {athlete.isOut ? 'Out' : athlete.isActive ? 'Active' : 'Waiting'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}