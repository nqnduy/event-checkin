"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
	const [userInfo, setUserInfo] = useState<any>(null);
	const [roleInfo, setRoleInfo] = useState<any>(null);
	const supabase = createClient();

	useEffect(() => {
		async function checkUser() {
			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUserInfo(user);

			if (user) {
				// Get role
				const { data, error } = await supabase
					.from("app_users")
					.select("*")
					.eq("id", user.id)
					.single();

				setRoleInfo({ data, error });
			}
		}

		checkUser();
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Debug User Info</h1>

			<div className="space-y-4">
				<div className="p-4 bg-gray-100 rounded">
					<h2 className="font-bold">Auth User:</h2>
					<pre>{JSON.stringify(userInfo, null, 2)}</pre>
				</div>

				<div className="p-4 bg-gray-100 rounded">
					<h2 className="font-bold">App User Role:</h2>
					<pre>{JSON.stringify(roleInfo, null, 2)}</pre>
				</div>

				{roleInfo?.data?.role === "admin" && (
					<div className="p-4 bg-green-100 rounded">
						<p>✅ User is ADMIN - Should see admin dashboard</p>
					</div>
				)}

				{roleInfo?.data?.role === "external_user" && (
					<div className="p-4 bg-blue-100 rounded">
						<p>
							ℹ️ User is EXTERNAL - Should see limited dashboard
						</p>
					</div>
				)}

				{roleInfo?.error && (
					<div className="p-4 bg-red-100 rounded">
						<p>❌ Error: User not found in app_users table</p>
						<p>Run this SQL with your user ID:</p>
						<code className="block mt-2 p-2 bg-white">
							INSERT INTO app_users (id, email, role) VALUES ('
							{userInfo?.id}', '{userInfo?.email}', 'admin');
						</code>
					</div>
				)}
			</div>
		</div>
	);
}
