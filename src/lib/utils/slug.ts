export function createEventSlug(eventName: string, eventDate: string): string {
	// Remove Vietnamese accents
	const removeAccents = (str: string) => {
		return str
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/đ/g, "d")
			.replace(/Đ/g, "D");
	};

	// Format date as DDMMYYYY
	const date = new Date(eventDate);
	const dateStr = `${date.getDate().toString().padStart(2, "0")}${(
		date.getMonth() + 1
	)
		.toString()
		.padStart(2, "0")}${date.getFullYear()}`;

	// Create slug from name
	const nameSlug = removeAccents(eventName)
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "") // Remove special chars
		.trim()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/-+/g, "-"); // Remove multiple -

	return `${nameSlug}-${dateStr}`;
}

export function parseEventSlug(
	slug: string
): { name: string; date: string } | null {
	// Extract date from end (DDMMYYYY format)
	const match = slug.match(/(.+)-(\d{8})$/);
	if (!match) return null;

	const [_, nameSlug, dateStr] = match;
	const day = dateStr.substring(0, 2);
	const month = dateStr.substring(2, 4);
	const year = dateStr.substring(4, 8);

	return {
		name: nameSlug.replace(/-/g, " "),
		date: `${year}-${month}-${day}`,
	};
}
