// src/components/admin/EventFilter.tsx
"use client";

import { useState } from "react";
import { Edit2, ChevronDown } from "lucide-react";
import { Event } from "@/types/event";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface EventFilterProps {
	events: Event[];
	selectedEventId: number | null;
	onEventSelect: (eventId: number | null) => void;
	onEditEvent: (event: Event) => void;
}

export function EventFilter({
	events,
	selectedEventId,
	onEventSelect,
	onEditEvent,
}: EventFilterProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selectedEvent = events.find((e) => e.id === selectedEventId);

	return (
		<div className="relative">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Lọc theo Event
			</label>

			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-2 cursor-pointer text-left bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50">
				<span
					className={
						selectedEvent ? "text-gray-900" : "text-gray-500"
					}>
					{selectedEvent ? selectedEvent.event_name : "Tất cả events"}
				</span>
				<ChevronDown
					className={`w-5 h-5 text-gray-400 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
					{/* Option: All Events - Đổi từ button thành div */}
					<div
						onClick={() => {
							onEventSelect(null);
							setIsOpen(false);
						}}
						className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between cursor-pointer">
						<span className="font-medium">Tất cả events</span>
					</div>

					<div className="border-t border-gray-200" />

					{/* Event Options - Đổi từ button thành div */}
					{events.map((event) => (
						<div
							key={event.id}
							onClick={() => {
								onEventSelect(event.id);
								setIsOpen(false);
							}}
							className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between group cursor-pointer">
							<div className="flex-1">
								<div className="font-medium">
									{event.event_name}
								</div>
								<div className="text-xs text-gray-500">
									{format(
										new Date(event.event_date),
										"dd/MM/yyyy",
										{ locale: vi }
									)}{" "}
									• Target: {event.target_checkins}
								</div>
							</div>

							{/* Edit button - Đổi từ button thành div với role="button" */}
							<div
								role="button"
								onClick={(e) => {
									e.stopPropagation(); // Ngăn trigger event select
									onEditEvent(event);
								}}
								className="ml-2 p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
								aria-label="Edit event">
								<Edit2 className="w-4 h-4 text-gray-600" />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
