"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Event } from "@/types/event";

export default function EventQRPage() {
	const params = useParams();
	const router = useRouter();
    const slug = params.slug as string;

	const [eventInfo, setEventInfo] = useState<Event | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const supabase = createClient();

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const checkInUrl = `${baseUrl}/checkin/${slug}`;

	// Load event info
	useEffect(() => {
		async function loadEvent() {
			try {
				const { data, error } = await supabase
					.from("events")
					.select("*")
					.eq("slug", slug)
					.single();

				if (error) throw error;

				if (data) {
					setEventInfo(data);
				}
			} catch (error) {
				console.error("Error loading event:", error);
			} finally {
				setIsLoading(false);
			}
		}

		if (slug) {
			loadEvent();
		}
	}, [slug, supabase]);

	const downloadQR = () => {
		const svg = document.getElementById("event-qr-code");
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx?.drawImage(img, 0, 0);
			canvas.toBlob((blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.download = `qr-${slug}.png`;
					a.href = url;
					a.click();
					URL.revokeObjectURL(url);
				}
			});
		};

		img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
	};

	const printQR = () => {
		window.print();
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Đang tải thông tin...</p>
				</div>
			</div>
		);
	}

	if (!eventInfo) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<p className="text-xl text-gray-600">Không tìm thấy sự kiện</p>
					<button
						onClick={() => router.push("/admin/dashboard")}
						className="mt-4 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Về Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-2xl mx-auto">
				{/* Header - Hidden when printing */}
				<div className="mb-6 flex items-center justify-between no-print">
                    <div></div>

					<div className="flex gap-3">
						<button
							onClick={printQR}
							className="px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
						>
							<Printer className="w-4 h-4" />
							In QR
						</button>
						<button
							onClick={downloadQR}
							className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
						>
							<Download className="w-4 h-4" />
							Tải xuống
						</button>
					</div>
				</div>

				{/* QR Code Card */}
				<div className="bg-white rounded-xl shadow-xl p-8 text-center">
					{/* Event Title */}
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						{eventInfo.event_name}
					</h1>

					{/* Event Date */}
					<div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
						<Calendar className="w-5 h-5" />
						<p className="text-lg">
							{format(new Date(eventInfo.event_date), "dd/MM/yyyy", { locale: vi })}
						</p>
					</div>

					{/* Event Description */}
					{eventInfo.description && (
						<p className="text-gray-500 mb-6 max-w-md mx-auto">
							{eventInfo.description}
						</p>
					)}

					{/* QR Code */}
					<div className="flex justify-center my-8">
						<div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-inner">
							<QRCodeSVG
								id="event-qr-code"
								value={checkInUrl}
								size={300}
								level="H"
								includeMargin={true}
								className="rounded-lg"
							/>
						</div>
					</div>

					{/* Instructions */}
					<div className="border-t pt-6">
						<p className="text-lg font-medium text-gray-700 mb-3">
							Quét mã QR để check-in sự kiện
						</p>

						{/* Event Stats */}
						<div className="flex justify-center gap-8">
							{/* Target */}
							<div className="flex items-center gap-2">
								<Target className="w-5 h-5 text-purple-600" />
								<div className="text-left">
									<p className="text-xs text-gray-500">Target</p>
									<p className="font-bold text-gray-800">
										{eventInfo.target_checkins.toLocaleString()} người
									</p>
								</div>
							</div>

							{/* Status */}
							<div className="flex items-center gap-2">
								<div className="text-left">
									<p className="text-xs text-gray-500">Trạng thái</p>
									<span
										className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
											eventInfo.status === "active"
												? "bg-green-100 text-green-800"
												: eventInfo.status === "completed"
												? "bg-gray-100 text-gray-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{eventInfo.status === "active"
											? "Đang diễn ra"
											: eventInfo.status === "completed"
											? "Đã kết thúc"
											: "Đã hủy"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Print styles */}
			<style jsx global>{`
				@media print {
					.no-print {
						display: none !important;
					}
					body {
						print-color-adjust: exact;
						-webkit-print-color-adjust: exact;
						background: white !important;
					}
					.bg-gray-50 {
						background: white !important;
					}
				}
			`}</style>
		</div>
	);
}