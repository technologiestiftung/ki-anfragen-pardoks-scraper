/* eslint-disable indent */
import { ParDoks, Vorgang } from "./common.js";
import postgres from "postgres";
import progress from "progress";

/**
 * This function checks if the provided value is an array.
 * If it is, it joins the array elements into a string separated by commas.
 * If it's not an array but a string, it simply returns the string.
 * If the value is undefined or null, it returns null.
 *
 */
function checkIfArray(value: string | string[] | undefined | null) {
	if (Array.isArray(value)) {
		return value.join(",");
	}

	return value ?? null;
}
export async function db({
	parDoks,
	url,
	filename,
}: {
	parDoks: ParDoks;
	url: string;
	filename: string;
}) {
	// Create a new database object
	const sql = postgres(url);

	try {
		// Call the insertParDoks function with your ParDoks object
		const exportResult = await sql`
      INSERT INTO export (aktualisiert, filename) VALUES (${parDoks.Export.$.aktualisiert},${filename}) RETURNING id
    `;

		// Create a new progress bar with the length of the Vorgang array
		const progressBarInsert = new progress(":bar :current/:total", {
			total: parDoks.Export.Vorgang.length,
		});
		for (const vorgang of parDoks.Export.Vorgang) {
			const vorgangResult = await sql`
		    INSERT INTO vorgang (VNr, VFunktion, ReihNr, VTyp, VTypL, VSys, VSysL, VIR, export_id)
		    VALUES (${checkIfArray(vorgang.VNr)}, ${checkIfArray(
					vorgang.VFunktion,
				)}, ${checkIfArray(vorgang.ReihNr)}, ${checkIfArray(
					vorgang.VTyp,
				)}, ${checkIfArray(vorgang.VTypL)}, ${checkIfArray(
					vorgang.VSys,
				)}, ${checkIfArray(vorgang.VSysL)}, ${checkIfArray(vorgang.VIR)}, ${
					exportResult[0].id
				})
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
