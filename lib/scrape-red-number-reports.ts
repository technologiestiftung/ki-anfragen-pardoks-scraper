import { connectDB } from "./sql.js";

export async function scrapeRedNumberReports(url: string) {
	const sql = connectDB(url);

	var formdata = new FormData();
	formdata.append("electoralTerm", "19");
	formdata.append("committee", "haupt-ausschuss.nsf");

	var requestOptions = {
		method: "POST",
		body: formdata,
	};

	const totalPagesRes = await fetch(
		"https://www.parlament-berlin.de/api/v1/documents/processes",
		requestOptions,
	);

	const totalPagesJsonRes = await totalPagesRes.json();
	const totalPages = Math.ceil(totalPagesJsonRes.paginator.total / totalPagesJsonRes.paginator.pageSize)

	for (let page = 1; page <= totalPages; page++) {

		var formdata = new FormData();
		formdata.append("electoralTerm", "19");
		formdata.append("committee", "haupt-ausschuss.nsf");
		formdata.append("startIndex", page.toString());

		var requestOptions = {
			method: "POST",
			body: formdata,
		};

		const res = await fetch(
			"https://www.parlament-berlin.de/api/v1/documents/processes",
			requestOptions,
		);

		const jsonRes = await res.json();

		for (let index = 0; index < jsonRes.items.length; index++) {
			const item = jsonRes.items[index];

			const insertedRedNumberProcess = await sql`
				INSERT INTO red_number_processes (process_id, status, category, description_title, description_text)
				VALUES (${item.processId},${item.status},${item.category},${item.description.title},${item.description.text})
				RETURNING *`;

			console.log(insertedRedNumberProcess[0].process_id);

			for (let docIdx = 0; docIdx < item.description.docs.length; docIdx++) {
				const doc = item.description.docs[docIdx];
				if (doc.href.includes("-v") && !doc.href.includes("?open&login")) {
					const insertedRedNumberReport = await sql`
					INSERT INTO red_number_reports (doc_name, doc_ref, doc_size, red_number_process_id)
					VALUES (${doc.name},${doc.href},${doc.size},${insertedRedNumberProcess[0].id})
					RETURNING *`;

					console.log(insertedRedNumberReport[0].doc_ref);
				}
			}
		}
	}
}

const databaseUrl = process.argv[2];
await scrapeRedNumberReports(databaseUrl);

process.exit(0);
