// src/app/dashboard/ExternalDashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { decryptData, maskPhoneNumber, maskName } from "@/lib/encryption";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download, Users, Calendar, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface EncryptedCheckinData {
	id: number;
	encrypted_name: string;
	encrypted_phone: string;
	checked_in_at: string;
}

interface Stats {
	total_checkins: number;
	today_checkins: number;
	last_hour_checkins: number;
}

export default function ExternalDashboardClient({
	initialData,
	initialStats,
}: {
	initialData: EncryptedCheckinData[];
	initialStats: Stats;
}) {
	const [checkins, setCheckins] = useState(initialData);
	const [stats, setStats] = useState(initialStats);
	const [dateFilter, setDateFilter] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const supabase = createClient();

	// Real-time subscription
	useEffect(() => {
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
					const newCheckin = {
						id: payload.new.id,
						encrypted_name: payload.new.encrypted_name,
						encrypted_phone: payload.new.encrypted_phone,
						checked_in_at: payload.new.checked_in_at,
					} as EncryptedCheckinData;

					setCheckins((prev) => [newCheckin, ...prev]);
					setStats((prev) => ({
						total_checkins: prev.total_checkins + 1,
						today_checkins: prev.today_checkins + 1,
						last_hour_checkins: prev.last_hour_checkins + 1,
					}));
					toast.success("Có check-in mới!");
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase]);

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

	// Manual refresh
	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const { data } = await supabase
				.from("event_checkins")
				.select("id, encrypted_name, encrypted_phone, checked_in_at")
				.order("checked_in_at", { ascending: false });

			if (data) setCheckins(data);

			const { data: newStats } = await supabase
				.rpc("get_checkin_stats")
				.single();

			if (newStats) setStats(newStats as Stats);

			toast.success("Dữ liệu đã được cập nhật");
		} catch (error) {
			toast.error("Lỗi khi tải dữ liệu");
		} finally {
			setIsRefreshing(false);
		}
	};

	// Filter by date
	const filteredCheckins = dateFilter
		? checkins.filter(
				(c) =>
					new Date(c.checked_in_at).toDateString() ===
					new Date(dateFilter).toDateString()
		  )
		: checkins;

	// Export masked data to Excel
	const exportToExcel = () => {
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
			};
		});

		const ws = XLSX.utils.json_to_sheet(exportData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Check-ins (Masked)");

		ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 20 }];

		const fileName = `checkins_masked_${format(
			new Date(),
			"yyyy-MM-dd_HH-mm-ss"
		)}.xlsx`;
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
				{/* Header with Privacy Notice */}
				<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
					<div className="flex justify-between items-center mb-4">
						<h1 className="text-3xl font-bold text-gray-800">
							Dashboard - External User
						</h1>
						<div className="flex gap-3">
							<button
								onClick={handleRefresh}
								disabled={isRefreshing}
								className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
								<RefreshCw
									className={`w-4 h-4 ${
										isRefreshing ? "animate-spin" : ""
									}`}
								/>
								Làm mới
							</button>
							<button
								onClick={exportToExcel}
								className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
								<Download className="w-4 h-4" />
								Export Excel
							</button>
						</div>
					</div>

					{/* Privacy Notice */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-center gap-2">
							<Shield className="w-5 h-5 text-blue-600" />
							<p className="text-sm text-blue-800">
								<strong>Bảo mật dữ liệu:</strong> Thông tin cá
								nhân đã được mã hóa để bảo vệ quyền riêng tư.
							</p>
						</div>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Tổng số check-in
								</p>
								<p className="text-3xl font-bold text-gray-900 mt-2">
									{stats.total_checkins.toLocaleString()}
								</p>
							</div>
							<div className="p-3 rounded-lg bg-blue-100">
								<Users className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Check-in hôm nay
								</p>
								<p className="text-3xl font-bold text-gray-900 mt-2">
									{stats.today_checkins.toLocaleString()}
								</p>
							</div>
							<div className="p-3 rounded-lg bg-green-100">
								<Calendar className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Dữ liệu được bảo vệ
								</p>
								<p className="text-3xl font-bold text-gray-900 mt-2">
									100%
								</p>
							</div>
							<div className="p-3 rounded-lg bg-purple-100">
								<Shield className="w-6 h-6 text-purple-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Filter */}
				<div className="bg-white rounded-xl shadow-sm p-4 mb-6">
					<div className="flex items-center gap-4">
						<label className="font-medium text-gray-700">
							Lọc theo ngày:
						</label>
						<input
							type="date"
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
						{dateFilter && (
							<button
								onClick={() => setDateFilter("")}
								className="px-3 py-2 cursor-pointer text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
								Xóa bộ lọc
							</button>
						)}
					</div>
				</div>

				{/* Masked Data Table */}
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
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{filteredCheckins.map((checkin, index) => {
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
										</tr>
									);
								})}
							</tbody>
						</table>

						{filteredCheckins.length === 0 && (
							<div className="text-center py-8 text-gray-500">
								Chưa có dữ liệu check-in
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
