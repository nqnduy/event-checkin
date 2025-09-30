"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkinSchema, type CheckinFormData } from "@/lib/validations/checkin";
import { createClient } from "@/lib/supabase/client";
import { encryptData } from "@/lib/encryption";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function CheckinPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const supabase = createClient();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CheckinFormData>({
		resolver: zodResolver(checkinSchema),
	});
	const getIPAddress = async (): Promise<string | null> => {
		try {
			// Try local API first
			const response = await fetch('/api/get-ip')
			const data = await response.json()
			if (data.ip) return data.ip

			// Fallback to external service
			const externalResponse = await fetch('https://api.ipify.org?format=json')
			const externalData = await externalResponse.json()
			return externalData.ip || null
		} catch (error) {
			console.error('Error fetching IP:', error)
			return null
		}
	}

	const onSubmit = async (data: CheckinFormData) => {
		setIsSubmitting(true);

		try {
			// Encrypt sensitive data
			const encryptedName = encryptData(data.full_name);
			const encryptedPhone = encryptData(data.phone_number);
			const ipAddress = await getIPAddress();

			// Insert to database
			const { error } = await supabase.from("event_checkins").insert({
				full_name: data.full_name,
				phone_number: data.phone_number,
				encrypted_name: encryptedName,
				encrypted_phone: encryptedPhone,
				terms_accepted: data.terms_accepted,
				ip_address: ipAddress,
				user_agent: navigator.userAgent,
			});

			if (error) throw error;

			// Show success
			setIsSuccess(true);
			toast.success("Check-in thành công!");

			// Reset form after 3 seconds
			setTimeout(() => {
				setIsSuccess(false);
				reset();
			}, 3000);
		} catch (error) {
			console.error("Check-in error:", error);
			toast.error("Có lỗi xảy ra, vui lòng thử lại");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSuccess) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
				<div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
					<CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						Check-in thành công!
					</h1>
					<p className="text-gray-600">
						Cảm ơn bạn đã tham gia sự kiện
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
				<h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
					Event Check-in
				</h1>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Họ tên */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Họ và tên *
						</label>
						<input
							{...register("full_name")}
							type="text"
							placeholder="Nguyễn Văn A"
							className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						{errors.full_name && (
							<p className="mt-1 text-sm text-red-600">
								{errors.full_name.message}
							</p>
						)}
					</div>

					{/* Số điện thoại */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Số điện thoại *
						</label>
						<input
							{...register("phone_number")}
							type="tel"
							placeholder="0901234567"
							maxLength={10}
							className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						{errors.phone_number && (
							<p className="mt-1 text-sm text-red-600">
								{errors.phone_number.message}
							</p>
						)}
					</div>

					{/* Terms checkbox */}
					<div className="flex items-start">
						<input
							{...register("terms_accepted")}
							type="checkbox"
							id="terms"
							className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
						/>
						<label
							htmlFor="terms"
							className="ml-2 text-sm text-gray-600">
							Tôi đã đọc và đồng ý với{" "}
							<a
								href="/terms"
								className="text-blue-600 hover:underline">
								điều khoản chia sẻ dữ liệu
							</a>
						</label>
					</div>
					{errors.terms_accepted && (
						<p className="text-sm text-red-600">
							{errors.terms_accepted.message}
						</p>
					)}

					{/* Submit button */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-3 px-4 cursor-pointer bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
						{isSubmitting ? (
							<>
								<Loader2 className="animate-spin mr-2 h-5 w-5" />
								Đang xử lý...
							</>
						) : (
							"Check-in"
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
