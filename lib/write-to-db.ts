/* eslint-disable indent */
import { ParDoks, Vorgang } from "./common.js";
import progress from "progress";
import { checkIfArray } from "./utils.js";
import { connectDB } from "./sql.js";

export async function insertVorgangs(
	vorgangs: Array<Vorgang>,
	exportId: number,
	url: string,
) {
	const sql = connectDB(url);
	// Create a new progress bar with the length of the Vorgang array
	const progressBarInsert = new progress(":bar :current/:total", {
		total: vorgangs.length,
	});
	for (const vorgang of vorgangs) {
		const vorgangResult = await sql`
		INSERT INTO vorgang (VNr, VFunktion, ReihNr, VTyp, VTypL, VSys, VSysL, VIR, export_id)
		VALUES (${checkIfArray(vorgang.VNr)}, ${checkIfArray(
			vorgang.VFunktion,
		)}, ${checkIfArray(vorgang.ReihNr)}, ${checkIfArray(
			vorgang.VTyp,
		)}, ${checkIfArray(vorgang.VTypL)}, ${checkIfArray(
			vorgang.VSys,
		)}, ${checkIfArray(vorgang.VSysL)}, ${checkIfArray(
			vorgang.VIR,
		)}, ${exportId})
	RETURNING id
  `;

		if (vorgang.Nebeneintrag) {
			for (const nebeneintrag of vorgang.Nebeneintrag) {
				await sql`
			INSERT INTO nebeneintrag (ReihNr, Desk, vorgang_id)
			VALUES (${checkIfArray(nebeneintrag.ReihNr)}, ${checkIfArray(
				nebeneintrag.Desk,
			)}, ${vorgangResult[0].id})
		`;
			}
		}
		if (vorgang.Dokument) {
			for (const dokument of vorgang.Dokument) {
				await sql`
			INSERT INTO dokument (ReihNr, DHerk, DHerkL, Wp, DokArt, DokArtL, DokTyp, DokTypL, NrInTyp, Desk, Titel, DokNr, DokDat, LokURL, Sb, VkDat, HNr, Jg, Abstract, Urheber, vorgang_id)
			VALUES (${checkIfArray(dokument.ReihNr)}, ${checkIfArray(
				dokument.DHerk,
			)}, ${checkIfArray(dokument.DHerkL)}, ${checkIfArray(
				dokument.Wp,
			)}, ${checkIfArray(dokument.DokArt)}, ${checkIfArray(
				dokument.DokArtL,
			)}, ${checkIfArray(dokument.DokTyp)}, ${checkIfArray(
				dokument.DokTypL,
			)}, ${checkIfArray(dokument.NrInTyp)}, ${checkIfArray(
				dokument.Desk,
			)}, ${checkIfArray(dokument.Titel)}, ${checkIfArray(
				dokument.DokNr,
			)}, ${checkIfArray(dokument.DokDat)}, ${checkIfArray(
				dokument.LokURL,
			)}, ${checkIfArray(dokument.Sb)}, ${checkIfArray(
				dokument.VkDat,
			)}, ${checkIfArray(dokument.HNr)}, ${checkIfArray(
				dokument.Jg,
			)}, ${checkIfArray(dokument.Abstract)}, ${checkIfArray(
				dokument.Urheber,
			)}, ${vorgangResult[0].id})
		`;
			}
		}

		progressBarInsert.tick();
	}
	progressBarInsert.terminate();
}

export async function write2DB({
	parDoks,
	url,
	filename,
}: {
	parDoks: ParDoks;
	url: string;
	filename: string;
}) {
	// Create a new database connection
	const sql = connectDB(url);
	try {
		// Call the insertParDoks function with your ParDoks object
		const exportResult =
			await sql`INSERT INTO export (aktualisiert, filename) VALUES (${parDoks.Export.$.aktualisiert},${filename}) RETURNING id`;

		await insertVorgangs(parDoks.Export.Vorgang, exportResult[0].id, url);

		interface Row extends Vorgang {
			id: number;
		}
		console.log("cleaning up database might take some time...");
		const rowsToDelete = await sql<Row[]>`SELECT v1.*
			FROM public.vorgang v1
			JOIN public.vorgang v2 ON v1.vnr = v2.vnr
			WHERE v1.vfunktion = 'delete'
			AND v2.vfunktion IS NULL;`;
		// Create a new progress bar with the length of the Vorgang array
		const progressBarDelete = new progress(":bar :current/:total", {
			total: rowsToDelete.length,
		});
		for (const row of rowsToDelete) {
			await sql`DELETE FROM public.vorgang WHERE id = ${row.id}`;
			progressBarDelete.tick();
		}
	} catch (error) {
		console.error(error);
	} finally {
		// Close the database connection when you're done
		await sql.end();
	}
}
