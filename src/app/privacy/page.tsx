export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
				<h1 className="text-3xl font-bold mb-6">Chính sách bảo mật</h1>

				<div className="prose max-w-none">
					<h2>Giới thiệu</h2>
					<p>
						Đây là hệ thống check-in sự kiện chính thức. Chúng tôi
						cam kết bảo vệ thông tin cá nhân của bạn.
					</p>

					<h2>Thông tin thu thập</h2>
					<ul>
						<li>Họ và tên</li>
						<li>Số điện thoại</li>
						<li>Địa chỉ IP (để chống duplicate)</li>
					</ul>

					<h2>Mục đích sử dụng</h2>
					<p>
						Thông tin chỉ được sử dụng để quản lý check-in sự kiện
						và không được chia sẻ với bên thứ ba.
					</p>

					<h2>Liên hệ</h2>
					<p>Email: ghi.doan@scnetwork.vn</p>
				</div>
			</div>
		</div>
	);
}
