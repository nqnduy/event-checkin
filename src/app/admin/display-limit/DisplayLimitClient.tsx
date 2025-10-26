"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types/event";
import { toast } from "sonner";
import { Save, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DisplayLimitClientProps {
	initialEvents: Event[];
}

export default function DisplayLimitClient({ initialEvents }: DisplayLimitClientProps) {
	const [events, setEvents] = useState(initialEvents);
	const [displayLimits, setDisplayLimits] = useState<{ [key: number]: number | null }>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const supabase = createClient();

	// Initialize display limits from events
	useEffect(() => {
		const initialLimits: { [key: number]: number | null } = {};
		events.forEach(event => {
			initialLimits[event.id] = event.display_limit || null;
		});
		setDisplayLimits(initialLimits);
	}, [events]);

	// Handle display limit change
	const handleDisplayLimitChange = (eventId: number, value: string) => {
		const numValue = value === "" ? null : parseInt(value);
		if (value !== "" && (isNaN(numValue!) || numValue! < 0)) {
			toast.error("Giá trị phải là số lớn hơn hoặc bằng 0");
			return;
		}
		setDisplayLimits(prev => ({
			...prev,
			[eventId]: numValue
		}));
	};

	// Save all changes
	const handleSaveAll = async () => {
		setIsSaving(true);
		try {
			// Get only events that have changes
			const changedEvents = events.filter(event => {
				const currentLimit = event.display_limit || null;
				const newLimit = displayLimits[event.id];
				return currentLimit !== newLimit;
			});

			// Update each changed event individually
			const updatePromises = changedEvents.map(event => {
				const newDisplayLimit = displayLimits[event.id];
				return supabase
					.from("events")
					.update({
						display_limit: newDisplayLimit,
						updated_at: new Date().toISOString()
					})
					.eq("id", event.id);
			});

			const results = await Promise.all(updatePromises);

			// Check for errors
			const errors = results.filter(result => result.error);
			if (errors.length > 0) {
				console.error("Some updates failed:", errors);
				throw new Error("Một số cập nhật thất bại");
			}

			// Update local state
			setEvents(prev => prev.map((event: Event) => ({
				...event,
				display_limit: displayLimits[event.id] ?? null
			})) as Event[]);

			toast.success(`Đã cập nhật ${changedEvents.length} event(s) thành công!`);
		} catch (error) {
			console.error("Error saving display limits:", error);
			toast.error("Có lỗi xảy ra khi lưu dữ liệu");
		} finally {
			setIsSaving(false);
		}
	};

	// Refresh data
	const handleRefresh = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("events")
				.select("*")
				.eq("status", "active")
				.order("event_date", { ascending: false });

			if (error) throw error;

			setEvents(data || []);
			toast.success("Đã làm mới dữ liệu");
		} catch (error) {
			console.error("Error refreshing data:", error);
			toast.error("Có lỗi xảy ra khi làm mới dữ liệu");
		} finally {
			setIsLoading(false);
		}
	};

	// Check if there are unsaved changes
	const hasUnsavedChanges = () => {
		return events.some(event => {
			const currentLimit = event.display_limit || null;
			const newLimit = displayLimits[event.id];
			return currentLimit !== newLimit;
		});
	};

	return (
		<div className="space-y-6">
			{/* Header Actions */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<Link
					href="/admin/dashboard"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Quay lại Dashboard
				</Link>

				<div className="flex items-stretch sm:items-center gap-2 sm:gap-3">
				<button
						onClick={handleSaveAll}
						disabled={isSaving || !hasUnsavedChanges()}
						className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<Save className="w-4 h-4" />
						<span className="hidden sm:inline">{isSaving ? "Đang lưu..." : "Lưu tất cả"}</span>
						<span className="sm:hidden">{isSaving ? "Lưu..." : "Lưu"}</span>
					</button>

					<button
						onClick={handleRefresh}
						disabled={isLoading}
						className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						<span className="hidden sm:inline">Làm mới</span>
					</button>
				</div>
			</div>

			{/* Events List */}
			<div className="bg-white rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Events Đang Diễn Ra ({events.length})
					</h2>
					<p className="text-sm text-gray-600 mt-1">
						Để trống nếu không muốn giới hạn hiển thị
					</p>
				</div>

				<div className="divide-y divide-gray-200">
					{events.map((event) => (
						<div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								{/* Event Info */}
								<div className="flex-1 min-w-0">
									<h3 className="text-lg font-medium text-gray-900 truncate">
										{event.event_name}
									</h3>
									<div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
										<span>📅 {new Date(event.event_date).toLocaleDateString('vi-VN')}</span>
										<span>🎯 Target: {event.target_checkins.toLocaleString()}</span>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${
											event.status === 'active'
												? 'bg-green-100 text-green-800'
												: event.status === 'completed'
												? 'bg-blue-100 text-blue-800'
												: 'bg-gray-100 text-gray-800'
										}`}>
											{event.status === 'active' ? 'Đang diễn ra' :
												event.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
										</span>
									</div>
								</div>

								{/* Display Limit Input */}
								<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
									<label className="text-sm font-medium text-gray-700 whitespace-nowrap">
										Giới hạn hiển thị:
									</label>
									<div className="flex items-center gap-2">
										<input
											type="number"
											min="0"
											value={displayLimits[event.id] === null ? "" : displayLimits[event.id] ?? ""}
											onChange={(e) => handleDisplayLimitChange(event.id, e.target.value)}
											placeholder="Không giới hạn"
											className="w-full sm:w-32 px-3 py-2 text-sm border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										<span className="text-sm text-gray-500 whitespace-nowrap">người</span>
									</div>
								</div>
							</div>

							{/* Current vs New Value Indicator */}
							{displayLimits[event.id] !== (event.display_limit || null) && (
								<div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
									<div className="flex items-center gap-2 text-sm">
										<span className="text-yellow-800">
											<strong>Thay đổi:</strong>
											{event.display_limit ? `${event.display_limit} → ` : "Không giới hạn → "}
											{displayLimits[event.id] ? `${displayLimits[event.id]}` : "Không giới hạn"}
										</span>
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{events.length === 0 && (
					<div className="px-6 py-12 text-center text-gray-500">
						<p>Chưa có event nào</p>
					</div>
				)}
			</div>

			{/* Summary */}
			{hasUnsavedChanges() && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<div className="flex items-center gap-2">
						<svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
						</svg>
						<span className="text-yellow-800 font-medium">
							Bạn có thay đổi chưa được lưu. Nhấn &quot;Lưu tất cả&quot; để lưu các thay đổi.
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
