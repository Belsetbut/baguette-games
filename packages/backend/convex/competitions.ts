import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCompetitions = query({
	handler: async (ctx) => {
		return await ctx.db.query("competitions").collect();
	},
});

export const getCompetition = query({
	args: {
		id: v.string(),
	},
	handler: async (ctx, args) => {
		const competition = await ctx.db.query("competitions")
			.filter(q => q.eq(q.field("id"), args.id))
			.first();
		return competition;
	},
});

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const newCompetition = await ctx.db.insert("competitions", {
			name: args.text,
			id: args.text,
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
