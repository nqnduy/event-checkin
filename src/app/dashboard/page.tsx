import { createServerClientAsync } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExternalDashboardClient from "./ExternalDashboardClient";

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
		.limit(500);

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
