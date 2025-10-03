import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const athletes = await ctx.db.query("athletes").collect();
    return athletes;
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    return athlete;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    id: v.string(),
    competitionId: v.string(),
    PB: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newAthlete = await ctx.db.insert("athletes", {
      name: args.name,
      id: args.id,
      competitionId: args.competitionId,
      PB: args.PB,
      attempts: [],
      isActive: false,
      isOut: false,
      highestHeightPassed: 0,
      totalAttempts: 0,
    });
    return await ctx.db.get(newAthlete);
  },
});

export const deleteAthlete = mutation({
  args: {
    id: v.id("athletes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const setActiveAthlete = mutation({
  args: {
    id: v.string(),
    competitionId: v.string(),
  },
  handler: async (ctx, args) => {
    // First, set all athletes to inactive
    const athletes = await ctx.db.query("athletes")
      .filter(q => q.eq(q.field("competitionId"), args.competitionId))
      .collect();
    
    for (const athlete of athletes) {
      await ctx.db.patch(athlete._id, { isActive: false });
    }
    
    // Then set the selected athlete to active
    const athlete = await ctx.db.query("athletes")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (athlete) {
      await ctx.db.patch(athlete._id, { isActive: true });
    }
    
    return { success: true };
  },
});

export const recordAttempt = mutation({
  args: {
    id: v.string(),
    height: v.number(),
    result: v.string(), // "O", "X", or "-"
  },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (!athlete) {
      return { success: false, error: "Athlete not found" };
    }
    
    const attempts = athlete.attempts || [];
    const currentHeightAttempts = attempts.filter(a => a.height === args.height);
    const attemptNumber = currentHeightAttempts.length + 1;
    
    if (attemptNumber > 3) {
      return { success: false, error: "Maximum attempts reached for this height" };
    }
    
    const newAttempt = {
      height: args.height,
      result: args.result,
      attemptNumber,
    };
    
    const updatedAttempts = [...attempts, newAttempt];
    
    // Update highest height passed if this was a successful attempt
    let highestHeightPassed = athlete.highestHeightPassed || 0;
    if (args.result === "O" && args.height > highestHeightPassed) {
      highestHeightPassed = args.height;
    }
    
    // Check if athlete is out (3 fails at current height)
    const isOut = currentHeightAttempts.length === 2 && 
                 currentHeightAttempts.every(a => a.result === "X") && 
                 args.result === "X";
    
    await ctx.db.patch(athlete._id, { 
      attempts: updatedAttempts,
      highestHeightPassed,
      isOut: isOut || athlete.isOut,
      totalAttempts: (athlete.totalAttempts || 0) + 1,
    });
    
    return { success: true };
  },
});

export const getAthletesByCompetition = query({
  args: { competitionId: v.string() },
  handler: async (ctx, args) => {
    const athletes = await ctx.db.query("athletes")
      .filter(q => q.eq(q.field("competitionId"), args.competitionId))
      .collect();
    
    // Sort athletes by highest height passed and then by total attempts (ascending)
    return athletes.sort((a, b) => {
      const aHeight = a.highestHeightPassed || 0;
      const bHeight = b.highestHeightPassed || 0;
      
      if (aHeight !== bHeight) {
        return bHeight - aHeight; // Descending by height
      }
      
      const aAttempts = a.totalAttempts || 0;
      const bAttempts = b.totalAttempts || 0;
      return aAttempts - bAttempts; // Ascending by attempts
    });
  },
});