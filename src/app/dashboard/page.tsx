import { createServerClientAsync } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExternalDashboardClient from "./ExternalDashboardClient";

function getLimitByTime(): number {
	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentTime = currentHour * 60 + currentMinute; // Convert to minutes since midnight

	// Define time thresholds in minutes since midnight (for testing: every 5 minutes)
	const thresholds = [
		{ time: 19 * 60 + 10, limit: 80 },   // 19:10
		{ time: 19 * 60 + 15, limit: 160 },  // 19:15
		{ time: 19 * 60 + 20, limit: 330 },  // 19:20
		{ time: 19 * 60 + 25, limit: 460 },  // 19:25
		{ time: 19 * 60 + 30, limit: 530 },  // 19:30
	];

	// Find the appropriate limit based on current time
	for (let i = thresholds.length - 1; i >= 0; i--) {
		if (currentTime >= thresholds[i].time) {
			return thresholds[i].limit;
		}
	}

	// Default limit if before 18:30
	return 80;
}

export default async function ExternalDashboard() {
	const supabase = await createServerClientAsync();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	// if (!user) redirect("/login");

	// Fetch encrypted data only
	const { data: checkins } = await supabase
		.from("event_checkins")
		.select("id, encrypted_name, encrypted_phone, event_id, terms_accepted, checked_in_at")
		.order("checked_in_at", { ascending: false })
		.limit(getLimitByTime());

	// Fetch events
	const { data: events } = await supabase
		.from("events")
		.select("*")
		.order("event_date", { ascending: false });

	const { data: stats } = await supabase.rpc("get_checkin_stats");

	return (
		<ExternalDashboardClient
			initialData={checkins || []}
			initialEvents={events || []}
			initialStats={
				stats || {
					total_checkins: 0,
					today_checkins: 0,
					last_hour_checkins: 0,
				}
			}
		/>
	);
}
