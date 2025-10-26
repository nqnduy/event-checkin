import { createServerClientAsync } from "@/lib/supabase/server";
import ExternalDashboardClient from "./ExternalDashboardClient";

export default async function ExternalDashboard() {
	const supabase = await createServerClientAsync();

	// Authentication check (commented out for now)
	// const { data: { user } } = await supabase.auth.getUser();
	// if (!user) redirect("/login");

	// Fetch encrypted data with pagination
	let allCheckins: Array<{
		id: number;
		encrypted_name: string;
		encrypted_phone: string;
		event_id?: number;
		terms_accepted: boolean;
		checked_in_at: string;
	}> = [];
	let from = 0;
	const pageSize = 1000;
	let hasMore = true;

	while (hasMore) {
		const { data: batch, error } = await supabase
			.from("event_checkins")
			.select("id, encrypted_name, encrypted_phone, event_id, terms_accepted, checked_in_at")
			.order("checked_in_at", { ascending: false })
			.range(from, from + pageSize - 1);

		if (error) {
			console.error("Error fetching checkins:", error);
			break;
		}

		if (!batch || batch.length === 0) {
			hasMore = false;
		} else {
			allCheckins = [...allCheckins, ...batch];
			if (batch.length < pageSize) {
				hasMore = false;
			}
			from += pageSize;
		}
	}

	const checkins = allCheckins;
	console.log(`Total checkins fetched: ${checkins.length}`);

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
