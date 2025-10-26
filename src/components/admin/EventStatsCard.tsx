"use client";

import { Target, TrendingUp, Users } from "lucide-react";
import { EventStats } from "@/types/event";

interface EventStatsCardProps {
	stats: EventStats | null;
	isLoading?: boolean;
	showFullData?: boolean; // For admin dashboard - show real numbers without display_limit
}

export function EventStatsCard({ stats, isLoading, showFullData = false }: EventStatsCardProps) {
	if (isLoading) {
		return (
			<div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
				<div className="h-20 bg-gray-200 rounded" />
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="bg-white rounded-xl shadow-sm p-6">
				<p className="text-gray-500 text-center">
					Chọn event để xem thống kê
				</p>
			</div>
		);
	}

	// Use display_limit if available and not showing full data, otherwise use total_checkins
	const displayCheckins = (showFullData || stats.display_limit === null || stats.display_limit === undefined)
		? stats.total_checkins
		: Math.min(stats.total_checkins, stats.display_limit);
	const progressPercentage = (showFullData || stats.display_limit === null || stats.display_limit === undefined)
		? Math.min(stats.completion_percentage, 100)
		: Math.min((displayCheckins / stats.target_checkins) * 100, 100);
	const isOverTarget = displayCheckins > stats.target_checkins;
	return (
		<div className="bg-white rounded-xl shadow-sm p-6">
			<h3 className="text-lg font-bold text-gray-800 mb-4">
				{stats.event_name}
			</h3>

			<div className="grid grid-cols-3 gap-4 mb-4">
				{/* Current Checkins */}
				<div className="text-center">
					<div className="flex justify-center mb-2">
						<Users className="w-8 h-8 text-blue-600" />
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{displayCheckins?.toLocaleString()}
					</p>
					<p className="text-sm text-gray-500">
						Đã check-in
					</p>
				</div>

				{/* Target */}
				<div className="text-center">
					<div className="flex justify-center mb-2">
						<Target className="w-8 h-8 text-purple-600" />
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{stats.target_checkins?.toLocaleString()}
					</p>
					<p className="text-sm text-gray-500">Target</p>
				</div>

				{/* Percentage */}
				<div className="text-center">
					<div className="flex justify-center mb-2">
						<TrendingUp className="w-8 h-8 text-green-600" />
					</div>
					<p
						className={`text-2xl font-bold ${
							isOverTarget ? "text-green-600" : "text-gray-900"
						}`}>
						{progressPercentage.toFixed(1)}%
					</p>
					<p className="text-sm text-gray-500">Đạt được</p>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="relative overflow-hidden">
				<div className="h-8 bg-gray-200 rounded-full overflow-hidden">
					<div
						className={`h-full transition-all duration-500 ${
							isOverTarget ? "bg-green-500" : "bg-blue-500"
						}`}
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>

				{/* Target Marker */}
				{!isOverTarget && (
					<div
						className="absolute top-0 h-8 w-0.5 bg-purple-600"
						style={{ left: "100%" }}
					/>
				)}
			</div>

			{/* Status Messages */}
			<div className="mt-4">
				{isOverTarget ? (
					<div className="bg-green-50 border border-green-200 rounded-lg p-3">
						<p className="text-green-800 text-sm font-medium">
							🎉 Xuất sắc! Đã vượt target{" "}
							{displayCheckins - stats.target_checkins} người
						</p>
					</div>
				) : progressPercentage >= 80 ? (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p className="text-blue-800 text-sm font-medium">
							📈 Sắp đạt target! Còn{" "}
							{stats.target_checkins - displayCheckins} người
							nữa
						</p>
					</div>
				) : (
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
						<p className="text-gray-700 text-sm">
							Cần thêm{" "}
							{stats.target_checkins - displayCheckins} người
							để đạt target
						</p>
					</div>
				)}
			</div>

			{/* Today's checkins */}
			{stats.today_checkins > 0 && (
				<div className="mt-3 text-sm text-gray-600">
					Hôm nay:{" "}
					<span className="font-semibold">
						{stats.today_checkins}
					</span>{" "}
					check-ins
				</div>
			)}
		</div>
	);
}
