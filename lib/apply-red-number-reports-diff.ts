import { connectDB } from "./sql.js";
import progress from "progress";

export async function applyRedNumberReportsDiff(databaseUrl: string) {
	// Get all relevant red number processes from API
	console.log("Fetching all red number processes from API...");
	const sql = connectDB(databaseUrl);
	var formdata = new FormData();
	formdata.append("electoralTerm", "19");
	formdata.append("committee", "haupt-ausschuss.nsf");
	formdata.append("status", "Erledigt");
	var requestOptions = {
		method: "POST",
		body: formdata,
	};
	const totalPagesRes = await fetch(
		"https://www.parlament-berlin.de/api/v1/documents/processes",
		requestOptions,
	);
	const totalPagesJsonRes = await totalPagesRes.json();
	const totalPages = Math.ceil(
		totalPagesJsonRes.paginator.total / totalPagesJsonRes.paginator.pageSize,
	);
	let progressBar = new progress(":bar :current/:total", {
		total: totalPages,
	});

	let allApiProcesses: Array<any> = [];
	for (let page = 1; page <= totalPages; page++) {
		var formdata = new FormData();
		formdata.append("electoralTerm", "19");
		formdata.append("committee", "haupt-ausschuss.nsf");
		formdata.append("startIndex", page.toString());
		formdata.append("status", "Erledigt");
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
			const relevantDocs = item.description.docs.filter(
				(doc: any) =>
					doc.href.includes("-v") && !doc.href.includes("?open&login"),
			);
			if (relevantDocs.length > 0) {
				allApiProcesses.push(item);
			}
		}
		progressBar.tick();
	}
	progressBar.terminate();
	console.log(`---> Found ${allApiProcesses.length} in API`);

	// Get all relevant red number processes from database
	console.log("Fetching all red number processes from database...");
	const allDatabaseProcesses = await sql`select * from red_number_processes;`;
	console.log(`---> Found ${allDatabaseProcesses.length} in database`);

	// Delete all processes from DB which are not (anymore) present in the API response
	const databaseProcessesToDelete = allDatabaseProcesses.filter((dItem) => {
		return (
			allApiProcesses.filter((item) => item.processId === dItem.process_id)
				.length === 0
		);
	});
	console.log(
		`Deleting ${databaseProcessesToDelete.length} processes from database...`,
	);
	progressBar = new progress(":bar :current/:total", {
		total: databaseProcessesToDelete.length,
	});
	for (let idx = 0; idx < databaseProcessesToDelete.length; idx++) {
		const element = databaseProcessesToDelete[idx];
		await sql`DELETE FROM red_number_processes where process_id = ${element.process_id}`;
		progressBar.tick();
	}
	progressBar.terminate();

	// Add all processes to DB which are present in API response
	const apiProcessesToAdd = allApiProcesses.filter((item) => {
		return (
			allDatabaseProcesses.filter(
				(dItem) => dItem.process_id === item.processId,
			).length === 0
		);
	});
	console.log(`Adding ${apiProcessesToAdd.length} processes to database...`);
	progressBar = new progress(":bar :current/:total", {
		total: apiProcessesToAdd.length,
	});
	for (let toAddIx = 0; toAddIx < apiProcessesToAdd.length; toAddIx++) {
		const item = apiProcessesToAdd[toAddIx];

		const insertedRedNumberProcess = await sql`
			INSERT INTO red_number_processes (process_id, status, category, description_title, description_text)
			VALUES (${item.processId},${item.status},${item.category},${item.description.title},${item.description.text})
			RETURNING *`;

		const relevantDocs = item.description.docs.filter(
			(doc: any) =>
				doc.href.includes("-v") && !doc.href.includes("?open&login"),
		);

		for (let idx = 0; idx < relevantDocs.length; idx++) {
			const doc = relevantDocs[idx];
			if (doc.href.includes("-v") && !doc.href.includes("?open&login")) {
				const insertedRedNumberReport = await sql`
				INSERT INTO red_number_reports (doc_name, doc_ref, doc_size, red_number_process_id)
				VALUES (${doc.name},${doc.href},${doc.size},${insertedRedNumberProcess[0].id})
				RETURNING *`;
			}
		}

		progressBar.tick();
	}

	progressBar.terminate();
}
