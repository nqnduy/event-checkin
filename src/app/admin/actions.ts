"use server";

import { encryptData } from "@/lib/encryption";
import { createServerClientAsync } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create admin client với service role key
const adminClient = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);

// Create external user account (chỉ admin)
export async function createExternalUser(formData: FormData) {
	const supabase = await createServerClientAsync();

	// Verify admin
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: userData } = await supabase
		.from("app_users")
		.select("role")
		.eq("id", user.id)
		.single();

	if (userData?.role !== "admin") {
		throw new Error("Unauthorized: Admin access required");
	}

	// Create user với admin client
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	const { data: newUser, error } = await adminClient.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});

	if (error) throw error;

	// Add to app_users table
	if (newUser.user) {
		await adminClient.from("app_users").insert({
			id: newUser.user.id,
			email,
			role: "external_user",
		});
	}

	revalidatePath("/admin/users");
	return { success: true };
}

// Delete checkin data (chỉ admin)
export async function deleteCheckin(checkinId: number) {
	const supabase = await createServerClientAsync();

	// Verify admin
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: userData } = await supabase
		.from("app_users")
		.select("role")
		.eq("id", user.id)
		.single();

	if (userData?.role !== "admin") {
		throw new Error("Unauthorized");
	}

	const { error } = await supabase
		.from("event_checkins")
		.delete()
		.eq("id", checkinId);

	if (error) throw error;

	revalidatePath("/admin/dashboard");
	return { success: true };
}

// Update checkin data (chỉ admin)
export async function updateCheckin(
	checkinId: number,
	data: {
		full_name?: string;
		phone_number?: string;
	}
) {
	const supabase = await createServerClientAsync();

	// Verify admin
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: userData } = await supabase
		.from("app_users")
		.select("role")
		.eq("id", user.id)
		.single();

	if (userData?.role !== "admin") {
		throw new Error("Unauthorized");
	}

	// Update với encryption mới nếu cần
	const updates: any = {};

	if (data.full_name) {
		updates.full_name = data.full_name;
		updates.encrypted_name = encryptData(data.full_name);
	}

	if (data.phone_number) {
		updates.phone_number = data.phone_number;
		updates.encrypted_phone = encryptData(data.phone_number);
	}

	const { error } = await supabase
		.from("event_checkins")
		.update(updates)
		.eq("id", checkinId);

	if (error) throw error;

	revalidatePath("/admin/dashboard");
	return { success: true };
}
