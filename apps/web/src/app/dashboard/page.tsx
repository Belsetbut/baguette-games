"use client";

import CompetitionList from "@/components/CompetitionList";
import { Button } from "@/components/ui/button";
import { api } from "@baguette-games/backend/convex/_generated/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import router from "next/router";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Dashboard() {
	const [newCompetition, setNewCompetition] = useState("");

	const competitions = useQuery(api.competitions.list);
	const createCompetition = useMutation(api.competitions.create);
	const user = useUser();
	const privateData = useQuery(api.privateData.get);

	   const handleSubmit = async () => {
		console.log("new competition: " + newCompetition)
        await createCompetition({ name: newCompetition});
        setNewCompetition("");
    }

	return (
		<>
			<Authenticated>
				<div>
					<div className="fixed top-15 right-7">
					<UserButton />
					</div>
					<h1 className="flex justify-center mt-5 text-2xl">Dashboard</h1>
					<div className="flex justify-end">
						<Dialog>
							<form >
								<DialogTrigger asChild>
									<Button className="m-5 border bg-background shadow-xs hover:bg-accent hover:text-shadow-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-accent-foreground">+</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Create Competition</DialogTitle>
									<div className="grid gap-4">
									<div className="grid gap-3">
									<Label htmlFor="name-1">Name</Label>
									<Input id="name-1" name="name" placeholder="Baguette Games" onChange={(e) => setNewCompetition(e.target.value)}/>
									</div>
								</div>
								<DialogFooter>
									<DialogClose asChild>
									<Button variant="outline">Cancel</Button>
									</DialogClose>
									<Button type="submit" onClick={handleSubmit}>Create</Button>
								</DialogFooter>
								</DialogContent>
							</form>
						</Dialog>
					</div>
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
