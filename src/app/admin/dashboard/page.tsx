import { createServerClientAsync } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboard() {
	const supabase = await createServerClientAsync();

	// Get user
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	// Check role với error handling
	let userRole = "external_user"; // default

	try {
		const { data: userData, error } = await supabase
			.from("app_users")
			.select("role")
			.eq("id", user.id)
			.single();

		if (error) {
			console.error("Error fetching user role:", error);
			// Nếu user chưa có trong app_users, tạo mới
			if (error.code === "PGRST116") {
				await supabase.from("app_users").insert({
					id: user.id,
					email: user.email!,
					role: "external_user",
				});
			}
			redirect("/dashboard"); // Redirect to external dashboard
		}

		userRole = userData?.role || "external_user";
	} catch (e) {
		console.error("Role check error:", e);
		redirect("/dashboard");
	}

	// Verify admin role
	if (userRole !== "admin") {
		redirect("/dashboard");
	}

	// Fetch checkins data
	const { data: checkins } = await supabase
		.from("event_checkins")
		.select("*")
		.order("checked_in_at", { ascending: false })
		.limit(1000); // Tăng limit để lấy nhiều data hơn

	// Fetch events
	const { data: events } = await supabase
		.from("events")
		.select("*")
		.order("event_date", { ascending: false });

	// Fetch stats - update để không cần single() nếu function trả về multiple rows
	const { data: stats } = await supabase.rpc("get_checkin_stats");

	return (
		<AdminDashboardClient
			initialData={checkins || []}
			initialEvents={events || []}
			initialStats={
				stats?.[0] || {
					total_checkins: 0,
					today_checkins: 0,
					last_hour_checkins: 0,
				}
			}
		/>
	);
}