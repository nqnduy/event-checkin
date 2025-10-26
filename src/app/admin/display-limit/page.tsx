import { createServerClientAsync } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DisplayLimitClient from "@/app/admin/display-limit/DisplayLimitClient";

export default async function DisplayLimitPage() {
	const supabase = await createServerClientAsync();

	// Check authentication
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

	// Fetch only active events
	const { data: events } = await supabase
		.from("events")
		.select("*")
		.eq("status", "active")
		.order("event_date", { ascending: false });

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Quản lý Giới hạn Hiển thị
					</h1>
					<p className="mt-2 text-gray-600">
						Chỉnh sửa giới hạn hiển thị số người đăng ký cho các event đang diễn ra
					</p>
				</div>

				<DisplayLimitClient initialEvents={events || []} />
			</div>
		</div>
	);
}
