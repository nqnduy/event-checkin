"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

export default function QRCodeGenerator() {
	const checkinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkin`;

	const downloadQR = () => {
		const svg = document.getElementById("qr-code-svg");
		const svgData = new XMLSerializer().serializeToString(svg!);
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
					a.download = "event-checkin-qr.png";
					a.href = url;
					a.click();
				}
			});
		};

		img.src = "data:image/svg+xml;base64," + btoa(svgData);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
				<h1 className="text-2xl font-bold text-center mb-6">
					QR Code Check-in
				</h1>

				<div className="flex justify-center mb-6">
					<QRCodeSVG
						id="qr-code-svg"
						value={checkinUrl}
						size={256}
						level="H"
						includeMargin
					/>
				</div>

				<p className="text-center text-gray-600 mb-4">
					Quét mã QR này để check-in sự kiện
				</p>

				<button
					onClick={downloadQR}
					className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
					<Download className="w-5 h-5" />
					Tải xuống QR Code
				</button>

				<div className="mt-4 p-4 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">
						<strong>URL Check-in:</strong>
					</p>
					<p className="text-xs text-gray-500 break-all mt-1">
						{checkinUrl}
					</p>
				</div>
			</div>
		</div>
	);
}
