"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { decryptData, maskPhoneNumber, maskName } from "@/lib/encryption";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Event, EventStats } from "@/types/event";
import { EventStatsCard } from "@/components/admin/EventStatsCard";
import { EventFilter } from "@/components/admin/EventFilter";

interface EncryptedCheckinData {
	id: number;
	encrypted_name: string;
	encrypted_phone: string;
	checked_in_at: string;
	terms_accepted: boolean;
	event_id?: number;
}
interface ExternalDashboardClientProps {
	initialData: EncryptedCheckinData[];
	initialEvents: Event[];
	initialStats: {
		total_checkins: number;
		today_checkins: number;
		last_hour_checkins: number;
	};
}

export default function ExternalDashboardClient({
	initialData,
	initialEvents,
	initialStats,
}: ExternalDashboardClientProps) {
	const [checkins, setCheckins] = useState(initialData);
	const [events, setEvents] = useState(initialEvents);
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
	const [eventStats, setEventStats] = useState<EventStats | null>(initialStats as unknown as EventStats);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const supabase = createClient();

	// Load event stats when selected event changes
	useEffect(() => {
		let isMounted = true;
		const fetchStats = async () => {
			if (isMounted) {
				await loadEventStats();
			}
		};

		fetchStats();

		return () => {
			isMounted = false;
		};
	}, [selectedEventId]);

	// Real-time subscription
	useEffect(() => {
		let isMounted = true;
		const channel = supabase
			.channel("external-checkins")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "event_checkins",
				},
				(payload) => {
					if (!isMounted) return;

					const newCheckin = payload.new as EncryptedCheckinData;
					setCheckins((prev) => [newCheckin, ...prev]);

					// Update stats if new checkin is for selected event
					if (
						!selectedEventId ||
						newCheckin.event_id === selectedEventId
					) {
						loadEventStats();
					}

					toast.success("Có check-in mới!");
				}
			)
			.subscribe();

		return () => {
			isMounted = false;
			supabase.removeChannel(channel);
		};
	}, [selectedEventId, supabase]);

	// Decrypt and mask data for display
	const getMaskedData = (encrypted_name: string, encrypted_phone: string) => {
		try {
			const name = decryptData(encrypted_name);
			const phone = decryptData(encrypted_phone);
			return {
				maskedName: maskName(name),
				maskedPhone: maskPhoneNumber(phone),
			};
		} catch (error) {
			return {
				maskedName: "***",
				maskedPhone: "***",
			};
		}
	};

	// Filter by date
	const filteredCheckins = selectedEventId
		? checkins.filter((c) => c.event_id === selectedEventId)
		: checkins;

	const loadEvents = async () => {
		const { data } = await supabase
			.from("events")
			.select("*")
			.order("event_date", { ascending: false });

		if (data) setEvents(data);
	};

	// Load event statistics
	const loadEventStats = async () => {
		try {
			if (!selectedEventId) {
				// Load overall stats if no event selected
				const { data, error } = await supabase.rpc("get_event_stats");
				if (error) {
					console.error("Error loading event stats:", error);
					return;
				}

				if (data && data.length > 0) {
					// Aggregate all events stats
					const totalStats: EventStats = {
						event_id: 0,
						event_name: "Tất cả Events",
						total_checkins: data.reduce(
							(sum: number, e: EventStats) =>
								sum + Number(e.total_checkins),
							0
						),
						target_checkins: data.reduce(
							(sum: number, e: EventStats) => sum + e.target_checkins,
							0
						),
						completion_percentage: 0,
						today_checkins: data.reduce(
							(sum: number, e: EventStats) =>
								sum + Number(e.today_checkins),
							0
						),
					};

					if (totalStats.target_checkins > 0) {
						totalStats.completion_percentage =
							(totalStats.total_checkins /
								totalStats.target_checkins) *
							100;
					}
					setEventStats(totalStats);
				}
			} else {
				// Load specific event stats
				const { data, error } = await supabase
					.rpc("get_event_stats", { p_event_id: selectedEventId })
					.single();

				if (error) {
					console.error("Error loading specific event stats:", error);
					return;
				}

				if (data) setEventStats(data as EventStats);
			}
		} catch (error) {
			console.error("Unexpected error in loadEventStats:", error);
		}
	};

	// Manual refresh
	const handleRefresh = async () => {
		let isMounted = true;
		setIsRefreshing(true);

		try {
			let query = supabase
				.from("event_checkins")
				.select("id, encrypted_name, encrypted_phone, event_id, terms_accepted, checked_in_at")
				.order("checked_in_at", { ascending: false });

			if (selectedEventId) {
				query = query.eq("event_id", selectedEventId);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error loading checkins:", error);
				if (isMounted) toast.error("Lỗi khi tải dữ liệu check-in");
				return;
			}

			if (data && isMounted) setCheckins(data);

			// Reload events and stats
			if (isMounted) {
				await loadEvents();
				await loadEventStats();
				toast.success("Dữ liệu đã được cập nhật");
			}
		} catch (error) {
			console.error("Unexpected error in handleRefresh:", error);
			if (isMounted) toast.error("Lỗi khi tải dữ liệu");
		} finally {
			if (isMounted) setIsRefreshing(false);
		}

		return () => {
			isMounted = false;
		};
	};

	// Export masked data to Excel
	const exportToExcel = () => {
		const selectedEvent = events.find((e) => e.id === selectedEventId);

		const exportData = filteredCheckins.map((item, index) => {
			const { maskedName, maskedPhone } = getMaskedData(
				item.encrypted_name,
				item.encrypted_phone
			);
			return {
				STT: index + 1,
				"Họ và tên (đã mã hóa)": maskedName,
				"Số điện thoại (đã mã hóa)": maskedPhone,
				"Thời gian check-in": format(
					new Date(item.checked_in_at),
					"dd/MM/yyyy HH:mm:ss",
					{ locale: vi }
				),
				"Đã đồng ý điều khoản": item.terms_accepted ? "Có" : "Không",
			};
		});

		const ws = XLSX.utils.json_to_sheet(exportData);
		const wb = XLSX.utils.book_new();

		if (eventStats) {
			const summaryData = [
				{
					Event: eventStats.event_name,
					"Tổng check-in": eventStats.total_checkins,
					Target: eventStats.target_checkins,
					"Đạt được (%)": eventStats.completion_percentage.toFixed(2),
					"Check-in hôm nay": eventStats.today_checkins,
					"Ngày export": format(new Date(), "dd/MM/yyyy HH:mm:ss", {
						locale: vi,
					}),
				},
			];

			const summaryWs = XLSX.utils.json_to_sheet(summaryData);
			XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
		}

		XLSX.utils.book_append_sheet(wb, ws, "Check-ins (Masked)");

		ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 20 }];

		const fileName = selectedEvent
			? `checkins_masked${selectedEvent.event_name.replace(
					/\s+/g,
					"_"
				)}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
			: `checkins_all_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
		const blob = new Blob([excelBuffer], {
			type: "application/octet-stream",
		});
		saveAs(blob, fileName);

		toast.success(`Đã xuất ${exportData.length} dòng dữ liệu (đã mã hóa)`);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
					<div className="flex justify-between items-center gap-4 flex-col md:flex-row">
						<h1 className="text-3xl font-bold text-gray-800">
							External Dashboard
						</h1>
						<div className="flex gap-3">
							<button
								onClick={handleRefresh}
								disabled={isRefreshing}
								className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
								<RefreshCw
									className={`w-4 h-4 hidden md:block ${
										isRefreshing ? "animate-spin" : ""
									}`}
								/>
								Làm mới
							</button>
							<button
								onClick={exportToExcel}
								className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
								<Download className="w-4 h-4 hidden md:block" />
								Export Excel
							</button>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-6">
					{/* Filter */}
					<div className="bg-white rounded-xl shadow-sm p-4 mb-2 md:mb-6">
						<div className="">
							<div className="mb-6">
								<EventFilter
									events={events}
									selectedEventId={selectedEventId}
									onEventSelect={setSelectedEventId}
								/>
							</div>
						</div>
					</div>
					{/* Event Statistics */}
					{eventStats && (
						<div className="mb-6">
							<EventStatsCard stats={eventStats} />
						</div>
					)}
				</div>

				{/* Data Table */}
				<div className="bg-white rounded-xl shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 border-b">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										STT
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Thời gian check-in
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Họ và tên (đã mã hóa)
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Số điện thoại (đã mã hóa)
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Event
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{filteredCheckins.map((checkin, index) => {
									const event = events.find(
										(e) => e.id === checkin.event_id
									);
									const { maskedName, maskedPhone } =
										getMaskedData(
											checkin.encrypted_name,
											checkin.encrypted_phone
										);
									return (
										<tr
											key={checkin.id}
											className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{index + 1}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{format(
													new Date(
														checkin.checked_in_at
													),
													"dd/MM/yyyy HH:mm:ss",
													{ locale: vi }
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{maskedName}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{maskedPhone}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{event ? (
													<span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
														{event.event_name}
													</span>
												) : (
													"N/A"
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{filteredCheckins.length === 0 && (
							<div className="text-center py-8 text-gray-500">
								{selectedEventId
									? "Chưa có check-in cho event này"
									: "Chưa có dữ liệu check-in"}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
