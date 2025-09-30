"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const supabase = createClient();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Step 1: Sign in
			const { data: authData, error: authError } =
				await supabase.auth.signInWithPassword({
					email,
					password,
				});

			if (authError) throw authError;

			if (!authData.user) {
				throw new Error("Login failed - no user data");
			}

			// Step 2: Get user role với error handling tốt hơn
			const { data: userData, error: roleError } = await supabase
				.from("app_users")
				.select("role")
				.eq("id", authData.user.id)
				.single();

			console.log("User role data:", userData); // Debug log

			if (roleError) {
				console.error("Role fetch error:", roleError);

				// Nếu user chưa có trong app_users, tạo với role mặc định
				if (roleError.code === "PGRST116") {
					// Row not found
					const { error: insertError } = await supabase
						.from("app_users")
						.insert({
							id: authData.user.id,
							email: email,
							role: "external_user", // Default role
						});

					if (!insertError) {
						router.push("/dashboard");
						toast.success("Đăng nhập thành công (External User)");
						return;
					}
				}

				throw new Error("Không thể xác định role của user");
			}

			// Step 3: Redirect based on role
			if (userData?.role === "admin") {
				console.log("Redirecting to admin dashboard...");
				router.push("/admin/dashboard");
				toast.success("Đăng nhập thành công (Admin)");
			} else if (userData?.role === "external_user") {
				console.log("Redirecting to external dashboard...");
				router.push("/dashboard");
				toast.success("Đăng nhập thành công (External User)");
			} else {
				throw new Error(`Unknown role: ${userData?.role}`);
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Đăng nhập thất bại";
			console.error("Login error:", error);
			toast.error(errorMessage || "Đăng nhập thất bại");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
				<h1 className="text-3xl font-bold text-center mb-8">
					Đăng nhập
				</h1>

				<form onSubmit={handleLogin} className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="admin@example.com"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Mật khẩu
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3 px-4 cursor-pointer bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
						{isLoading ? (
							<>
								<Loader2 className="animate-spin h-5 w-5" />{" "}
								Đang xử lý...
							</>
						) : (
							<>
								<LogIn className="h-5 w-5" /> Đăng nhập
							</>
						)}
					</button>
				</form>

				{/* Debug info - xóa khi production */}
				<div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
					<p>Debug: Check console for logs</p>
				</div>
			</div>
		</div>
	);
}
