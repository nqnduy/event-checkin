// src/app/dashboard/page.tsx
import { createServerClientAsync } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExternalDashboardClient from "./ExternalDashboardClient";

export default async function ExternalDashboard() {
	const supabase = await createServerClientAsync();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	// Fetch encrypted data only
	const { data: checkins } = await supabase
		.from("event_checkins")
		.select("id, encrypted_name, encrypted_phone, checked_in_at")
		.order("checked_in_at", { ascending: false })
		.limit(100);

	const { data: stats } = await supabase.rpc("get_checkin_stats").single();

	return (
		<ExternalDashboardClient
			initialData={checkins || []}
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
