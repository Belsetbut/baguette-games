import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	competitions: defineTable({
		name: v.string(),
		id: v.string(),
		currentHeight: v.optional(v.number()),
		timerDuration: v.optional(v.number()), // Timer duration in seconds
		timerEndTime: v.optional(v.number()), // Timestamp when timer ends
		timerActive: v.optional(v.boolean()), // Whether timer is currently active
	}), 
	athletes: defineTable({
		name: v.string(),
		id: v.string(),
		startingHeight: v.optional(v.number()),
		height: v.optional(v.number()),
		tryNumber: v.optional(v.number()),
		competitionId: v.optional(v.string()),
		PB: v.optional(v.number()),
		attempts: v.optional(v.array(v.object({
			height: v.number(),
			result: v.string(), // "O" for pass, "X" for fail, "-" for pass
			attemptNumber: v.number(),
		}))),
		isActive: v.optional(v.boolean()),
		isOut: v.optional(v.boolean()),
		highestHeightPassed: v.optional(v.number()),
		totalAttempts: v.optional(v.number()),
	}),
});
