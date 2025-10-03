"use client";

import CompetitionList from "@/components/CompetitionList";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";

export default function Dashboard() {
	const user = useUser();
	const privateData = useQuery(api.privateData.get);

	return (
		<>
			<Authenticated>
				<div>
					<div className="fixed top-15 right-7">
					<UserButton />
					</div>
					<h1 className="flex justify-center mt-5 text-2xl">Dashboard</h1>
					<CompetitionList />
				</div>
			</Authenticated>
			<Unauthenticated>
				<SignInButton />
			</Unauthenticated>
			<AuthLoading>
				<div>Loading...</div>
			</AuthLoading>
		</>
	);
}
