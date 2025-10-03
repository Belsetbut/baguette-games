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
	},
	handler: async (ctx, args) => {
		const newCompetition = await ctx.db.insert("competitions", {
			name: args.name,
			id: args.name,
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
