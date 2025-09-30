"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X, Calendar, Target, FileText } from "lucide-react";
import { format } from "date-fns";
import { createEventSlug } from '@/lib/utils/slug'

const eventSchema = z.object({
	event_name: z.string().min(3, "Tên event phải có ít nhất 3 ký tự"),
	event_date: z.string().min(1, "Vui lòng chọn ngày tổ chức"),
	target_checkins: z
		.number()
		.min(1, "Target phải lớn hơn 0")
		.max(100000, "Target không được vượt quá 100,000"),
	description: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onEventCreated: () => void;
}

export function CreateEventModal({
	isOpen,
	onClose,
	onEventCreated,
}: CreateEventModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const supabase = createClient();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<EventFormData>({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			event_date: format(new Date(), "yyyy-MM-dd"),
			target_checkins: 500,
		},
	});

	const onSubmit = async (data: EventFormData) => {
		setIsSubmitting(true);

        try {
            const slug = createEventSlug(data.event_name, data.event_date)
			const { error } = await supabase.from("events").insert({
				event_name: data.event_name,
				event_date: data.event_date,
				target_checkins: data.target_checkins,
				description: data.description || null,
                slug: slug
			});

			if (error) throw error;

			toast.success("Event đã được tạo thành công!");
			reset();
			onEventCreated();
			onClose();
		} catch (error) {
			console.error("Create event error:", error);
			toast.error("Không thể tạo event");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-bold text-gray-800">
						Tạo Event Mới
					</h2>
					<button
						onClick={onClose}
						className="p-1 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors">
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="p-6 space-y-4">
					{/* Event Name */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
							<FileText className="w-4 h-4" />
							Tên Event
						</label>
						<input
							{...register("event_name")}
							type="text"
							placeholder="VD: Grand Opening 2024"
							className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
						{errors.event_name && (
							<p className="mt-1 text-sm text-red-600">
								{errors.event_name.message}
							</p>
						)}
					</div>

					{/* Event Date */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
							<Calendar className="w-4 h-4" />
							Ngày tổ chức
						</label>
						<input
							{...register("event_date")}
							type="date"
							className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
						{errors.event_date && (
							<p className="mt-1 text-sm text-red-600">
								{errors.event_date.message}
							</p>
						)}
					</div>

					{/* Target Checkins */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
							<Target className="w-4 h-4" />
							Target số người check-in
						</label>
						<input
							{...register("target_checkins", {
								valueAsNumber: true,
							})}
							type="number"
							min="1"
							placeholder="500"
							className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
						{errors.target_checkins && (
							<p className="mt-1 text-sm text-red-600">
								{errors.target_checkins.message}
							</p>
						)}
					</div>

					{/* Description */}
					<div>
						<label className="text-sm font-medium text-gray-700 mb-2 block">
							Mô tả (Tùy chọn)
						</label>
						<textarea
							{...register("description")}
							rows={3}
							placeholder="Thông tin thêm về event..."
							className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
							Hủy
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
							{isSubmitting ? "Đang tạo..." : "Tạo Event"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
