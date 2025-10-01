"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkinSchema, type CheckinFormData } from "@/lib/validations/checkin";
import { createClient } from "@/lib/supabase/client";
import { encryptData } from "@/lib/encryption";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { Event } from "@/types/event";
import TermsModal from "@/components/TermsModal"; // ← Import modal

// Helper: Check if IP is localhost/private
const isLocalIP = (ip: string): boolean => {
	if (!ip) return false;

	const localPatterns = [
		'127.0.0.1',
		'::1',
		'localhost',
	];

	const privatePatterns = [
		/^192\.168\./,
		/^10\./,
		/^172\.(1[6-9]|2[0-9]|3[0-1])\./
	];

	if (localPatterns.includes(ip)) return true;
	return privatePatterns.some(pattern => pattern.test(ip));
};

export default function EventCheckinPage() {
	const params = useParams();
	const slug = params.slug as string;

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [eventInfo, setEventInfo] = useState<Event | null>(null);
	const [isCheckingStatus, setIsCheckingStatus] = useState(true);
	const [existingCheckin, setExistingCheckin] = useState<Record<string, unknown> | null>(null);
	const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

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
			const response = await fetch('/api/get-ip');
			const data = await response.json();

			if (data.isLocalhost && process.env.NODE_ENV === 'development') {
				console.log('🔧 Running on localhost, IP:', data.ip);
				try {
					const realIPResponse = await fetch('https://api.ipify.org?format=json');
					const realIPData = await realIPResponse.json();
					return realIPData.ip || data.ip;
				} catch {
					return data.ip;
				}
			}

			return data.ip;
		} catch (error) {
			console.error('Error fetching IP:', error);
			return null;
		}
	};

	// Check if user already checked in (by IP)
	const checkExistingCheckin = async (eventId: number, ipAddress: string) => {
		try {
			// Development mode + local IP: skip check
			if (process.env.NODE_ENV === 'development' && isLocalIP(ipAddress)) {
				console.log('🔧 Dev mode: Skipping duplicate check for localhost');
				return null;
			}

			const { data, error } = await supabase
				.from("event_checkins")
				.select("id, event_id, ip_address, full_name")
				.eq("event_id", eventId)
				.eq("ip_address", ipAddress)
				.limit(1)
				.maybeSingle();

			if (error && error.code !== 'PGRST116') {
				console.error('Error checking existing checkin:', error);
				return null;
			}

			return data;
		} catch (error) {
			console.error('Error in checkExistingCheckin:', error);
			return null;
		}
	};

	// Load event info and check existing check-in
	useEffect(() => {
		async function loadEventAndCheckStatus() {
			setIsCheckingStatus(true);

			try {
				const { data: eventData } = await supabase
					.from("events")
					.select("*")
					.eq("slug", slug)
					.eq('status', 'active')
					.single();

				if (!eventData) {
					toast.error("Không tìm thấy sự kiện");
					setIsCheckingStatus(false);
					return;
				}

				setEventInfo(eventData);

				const userIP = await getIPAddress();

				if (!userIP) {
					console.warn('Could not get user IP');
					setIsCheckingStatus(false);
					return;
				}

				const existingCheckinData = await checkExistingCheckin(
					parseInt(eventData.id.toString()),
					userIP
				);

				if (existingCheckinData) {
					console.log('✅ User already checked in:', existingCheckinData);
					setExistingCheckin(existingCheckinData);
					setIsSuccess(true);
				}

			} catch (error) {
				console.error('Error loading event:', error);
				toast.error("Có lỗi khi tải thông tin sự kiện");
			} finally {
				setIsCheckingStatus(false);
			}
		}

		if (slug && slug !== "default") {
			loadEventAndCheckStatus();
		}
	}, [slug, supabase, checkExistingCheckin]);

	const onSubmit = async (data: CheckinFormData) => {
		setIsSubmitting(true);

		try {
			const encryptedName = encryptData(data.full_name);
			const encryptedPhone = encryptData(data.phone_number);
			const ipAddress = await getIPAddress();

			// Double-check nếu đã check-in (except localhost in dev)
			if (eventInfo && ipAddress) {
				const recheck = await checkExistingCheckin(
					parseInt(eventInfo.id.toString()),
					ipAddress
				);

				if (recheck) {
					toast.info("Bạn đã đăng ký rồi!");
					setExistingCheckin(recheck);
					setIsSuccess(true);
					setIsSubmitting(false);
					return;
				}
			}

			const { error } = await supabase.from("event_checkins").insert({
				full_name: data.full_name,
				phone_number: data.phone_number,
				encrypted_name: encryptedName,
				encrypted_phone: encryptedPhone,
				terms_accepted: data.terms_accepted,
				event_id: eventInfo?.id ? parseInt(eventInfo.id.toString()) : null,
				ip_address: ipAddress,
				user_agent: navigator.userAgent,
			});

			if (error) throw error;

			setIsSuccess(true);
			toast.success("Đăng ký thành công!");
			reset();

		} catch (error: unknown) {
			console.error("Đăng ký error:", error);

			if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
				toast.info("Bạn đã đăng ký rồi!");
				setIsSuccess(true);
			} else {
				toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Loading state
	if (isCheckingStatus) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
					<Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
					<h2 className="text-xl font-semibold text-gray-700">
						Đang kiểm tra thông tin...
					</h2>
				</div>
			</div>
		);
	}

	// Success state
	if (isSuccess) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
				<div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
					<CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />

					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						{existingCheckin ? 'Bạn đã đăng ký rồi!' : 'Đăng ký thành công!'}
					</h1>

					{eventInfo && (
						<p className="text-gray-600 mb-2">
							Sự kiện: <strong>{eventInfo.event_name}</strong>
						</p>
					)}

					<p className="text-gray-600 mb-6">
						Cảm ơn bạn đã tham gia sự kiện
					</p>

					{existingCheckin && (
						<div className="mt-6 pt-6 border-t border-gray-200">
							<p className="text-xs text-gray-500">
								Bạn đã sử dụng thiết bị này để đăng ký trước đó.
								<br />
								Nếu đây là lỗi, vui lòng liên hệ ban tổ chức.
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Form state
	return (
		<>
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
				<div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
					{eventInfo && (
						<div className="mb-6 p-4 bg-blue-50 rounded-lg">
							<h2 className="font-bold text-blue-900">
								{eventInfo.event_name}
							</h2>
							{eventInfo.description && (
								<p className="text-sm text-blue-700 mt-1">
									{eventInfo.description}
								</p>
							)}
						</div>
					)}

					<h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
						Đăng ký tham gia sự kiện
					</h1>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
									<button
									type="button"
									onClick={() => setIsTermsModalOpen(true)}
									className="text-blue-600 cursor-pointer hover:underline font-medium"
								>
									điều khoản chia sẻ dữ liệu
								</button>
							</label>
						</div>
						{errors.terms_accepted && (
							<p className="text-sm text-red-600">
								{errors.terms_accepted.message}
							</p>
						)}

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
								"Đăng ký"
							)}
						</button>
					</form>

					<div className="mt-6 pt-6 border-t border-gray-200">
						<p className="text-xs text-center text-gray-500">
							Mỗi thiết bị chỉ có thể đăng ký một lần cho sự kiện này
						</p>
						{process.env.NODE_ENV === 'development' && (
							<p className="text-xs text-center text-orange-500 mt-2">
								🔧 Dev mode: Multiple check-ins allowed from localhost
							</p>
						)}
					</div>
				</div>
			</div>
			<TermsModal
				isOpen={isTermsModalOpen}
				onClose={() => setIsTermsModalOpen(false)}
			/>
		</>
	);
}