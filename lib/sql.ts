import postgres from "postgres";

export function connectDB(url: string) {
	const sql = postgres(url);
	return sql;
}
