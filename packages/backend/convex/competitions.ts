import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


export const list = query({
  handler: async (ctx) => {
    const competitions = await ctx.db.query("competitions").collect();
    return competitions;
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const competition = await ctx.db.query("competitions")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    return competition;
  },
});

export const create = mutation({
	args: {
		name: v.string(),
		id: v.string(),
	},
	handler: async (ctx, args) => {
		const newCompetition = await ctx.db.insert("competitions", {
			name: args.name,
			id: args.id,
      currentHeight: 2.00, // Default starting height
      timerDuration: 60, // Default timer duration (60 seconds)
      timerActive: false,
		});
		return await ctx.db.get(newCompetition);
	},
});

export const deleteCompetition = mutation({
	args: {
		id: v.id("competitions"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

export const setCurrentHeight = mutation({
  args: {
    id: v.string(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db.query("competitions")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (!competition) {
      return { success: false, error: "Competition not found" };
    }
    
    await ctx.db.patch(competition._id, { currentHeight: args.height });
    return { success: true };
  },
});

export const setTimerDuration = mutation({
  args: {
    id: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db.query("competitions")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (!competition) {
      return { success: false, error: "Competition not found" };
    }
    
    await ctx.db.patch(competition._id, { timerDuration: args.duration });
    return { success: true };
  },
});

export const startTimer = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db.query("competitions")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (!competition) {
      return { success: false, error: "Competition not found" };
    }
    
    const timerDuration = competition.timerDuration || 60;
    const timerEndTime = Date.now() + timerDuration * 1000;
    
    await ctx.db.patch(competition._id, { 
      timerEndTime,
      timerActive: true,
    });
    
    return { success: true };
  },
});

export const stopTimer = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db.query("competitions")
      .filter(q => q.eq(q.field("id"), args.id))
      .first();
    
    if (!competition) {
      return { success: false, error: "Competition not found" };
    }
    
    await ctx.db.patch(competition._id, { timerActive: false });
    return { success: true };
  },
});
