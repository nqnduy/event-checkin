"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface TermsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		if (isOpen) {
			window.addEventListener("keydown", handleEsc);
		}

		return () => {
			window.removeEventListener("keydown", handleEsc);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-safe">
				<div
					className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
						<h2 className="text-xl md:text-2xl font-bold text-gray-800">
							Điều khoản dữ liệu cá nhân
						</h2>
						<button
							onClick={onClose}
							className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
							aria-label="Close"
						>
							<X className="w-6 h-6 text-gray-600" />
						</button>
					</div>

					{/* Content - Scrollable */}
					<div className="p-6 overflow-y-auto flex-1"> {/* ← flex-1 for grow */}
						<div className="prose prose-sm max-w-none text-gray-700">
							<h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">
								Điều khoản về thu thập, sử dụng và bảo mật dữ liệu cá nhân
							</h3>

							<div className="space-y-6 text-sm md:text-base">
								{/* Section 1 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										1. Mục đích thu thập dữ liệu cá nhân
									</h4>
									<p className="mb-3">
										Khi đăng ký tham gia sự kiện, Người tham dự đồng ý cung
										cấp dữ liệu cá nhân, bao gồm nhưng không giới hạn:{" "}
										<strong>Họ và tên</strong>,{" "}
										<strong>Số điện thoại</strong>. Các dữ liệu này được thu
										thập và sử dụng cho mục đích:
									</p>
									<ul className="list-disc pl-6 space-y-1">
										<li>Xác nhận thông tin tham dự sự kiện;</li>
										<li>
											Hỗ trợ công tác quản lý, liên hệ và tổ chức sự kiện;
										</li>
										<li>
											Lưu trữ hồ sơ phục vụ công tác thống kê, báo cáo và cải
											thiện chất lượng tổ chức sự kiện.
										</li>
										<li>
											Thực hiện các hoạt động tiếp thị, chăm sóc khách hàng, giới thiệu sản phẩm, chương trình khuyến mãi từ Công ty TNHH Nước Giải Khát Suntory Pepsico Việt Nam.
										</li>
									</ul>
								</div>

								{/* Section 2 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										2. Phạm vi sử dụng dữ liệu
									</h4>
									<p className="mb-3">
										Dữ liệu cá nhân chỉ được chia sẻ cho đơn vị tổ chức bao gồm:
									</p>
									<ul className="list-disc pl-6 space-y-2 mb-3">
										<li>
											Công ty Cổ phần Truyền Thông NK Central
										</li>
										<li>
											Công ty TNHH Nước Giải Khát Suntory Pepsico Việt Nam.
										</li>
									</ul>
									<p>
										Dữ liệu này{" "}
										<strong>
											không được chia sẻ, tiết lộ, chuyển nhượng, buôn bán
											hoặc cung cấp cho bất kỳ bên thứ ba nào
										</strong>{" "}
										ngoài phạm vi nêu trên, trừ trường hợp có yêu cầu từ cơ
										quan nhà nước có thẩm quyền theo quy định pháp luật.
									</p>
								</div>

								{/* Section 3 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										3. Nguyên tắc bảo mật và lưu trữ
									</h4>
									<p className="mb-3">
										Ban Tổ Chức cam kết áp dụng các biện pháp quản lý, kỹ
											thuật và bảo mật hợp lý để bảo vệ dữ liệu cá nhân khỏi
											việc truy cập, tiết lộ, sử dụng, thay đổi hoặc phá hủy
											trái phép.
									</p>
									<p>
										Thời hạn lưu trữ dữ liệu: không vượt quá thời gian cần
											thiết để hoàn thành các mục đích nêu tại Mục 1, trừ khi
											pháp luật có quy định khác.
									</p>
								</div>

								{/* Section 4 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										4. Quyền của Người tham dự
									</h4>
									<p className="mb-2">Người tham dự có quyền:</p>
									<ul className="list-disc pl-6 space-y-2">
										<li>
											Được biết về mục đích thu thập, phạm vi sử dụng dữ liệu
											cá nhân;
										</li>
										<li>
											Yêu cầu Ban Tổ Chức cập nhật, chỉnh sửa, xóa bỏ dữ liệu
											cá nhân trong trường hợp thông tin không chính xác hoặc
											khi không còn cần thiết cho mục đích đã nêu;
										</li>
										<li>
											Khiếu nại, tố cáo hoặc khởi kiện nếu phát hiện hành vi
											vi phạm liên quan đến dữ liệu cá nhân của mình theo quy
											định pháp luật.
										</li>
									</ul>
								</div>

								{/* Section 5 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										5. Cam kết của Người tham dự
									</h4>
									<p className="mb-3">
										Bằng việc cung cấp dữ liệu cá nhân và tham gia sự kiện,
										Người tham dự xác nhận đã đọc, hiểu rõ và đồng ý với toàn
										bộ các điều khoản nêu trên.
									</p>
									<p>
										Người tham dự cam kết cung cấp thông tin chính xác và
										chịu trách nhiệm về tính trung thực của thông tin đã cung
										cấp.
									</p>
								</div>

								{/* Section 6 */}
								<div>
									<h4 className="font-bold text-gray-900 mb-2">
										6. Cam kết của Đơn vị tổ chức
									</h4>
									<p className="mb-3">
										Công ty Cổ phần Truyền Thông NK Central và Công ty TNHH Nước Giải Khát Suntory Pepsico Việt Nam cam kết áp dụng các biện pháp kỹ thuật và tổ chức phù hợp nhằm đảm bảo dữ liệu cá nhân của Người dùng được bảo mật, an toàn, không bị truy cập trái phép, tiết lộ, sửa đổi hoặc phá hủy.
									</p>
									<p>
										Mọi vi phạm sẽ được xử lý theo quy định của pháp luật Việt Nam.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer - Fixed at bottom with safe area */}
					<div className="p-4 md:p-6 pb-safe border-t border-gray-200 bg-gray-50 flex-shrink-0"> {/* ← Added pb-safe and flex-shrink-0 */}
						<button
							onClick={onClose}
							className="w-full cursor-pointer py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
						>
							Đã hiểu
						</button>
					</div>
				</div>
			</div>
		</>
	);
}