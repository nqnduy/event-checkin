import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

export function encryptData(text: string): string {
	return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decryptData(encryptedText: string): string {
	const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}

// Mask phone number for display (e.g., 0901234567 -> 090***4567)
export function maskPhoneNumber(phone: string): string {
	if (phone.length < 10) return phone;
	return phone.substring(0, 3) + "***" + phone.substring(7);
}

// Mask name for display (e.g., Nguyen Van A -> Nguyen V** *)
export function maskName(name: string): string {
	const parts = name.split(" ");
	if (parts.length === 1) return parts[0].substring(0, 2) + "***";

	const masked = parts.map((part, index) => {
		if (index === 0) return part; // Keep first name
		return part.charAt(0) + "*".repeat(Math.max(1, part.length - 1));
	});

	return masked.join(" ");
}
