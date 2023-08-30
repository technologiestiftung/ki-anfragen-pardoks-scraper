/* eslint-disable indent */
import progress from "progress";
import { ParDoks } from "./common.js";
import { connectDB } from "./sql.js";
import { checkIfArray } from "./utils.js";

export async function applyDiff(newParDoks: ParDoks, dbUrl: string) {
	const sql = connectDB(dbUrl);
	const dbExport = await sql`select * from export;`;

	console.log("Loading local and remote Vorgänge...");
	// Get all undeleted local Vorgänge
	const undeletedLocalVorgänge = newParDoks.Export.Vorgang.filter((v) => {
		return (
			newParDoks.Export.Vorgang.filter((vv) => vv.VNr[0] === v.VNr[0]).length ==
				2 && !v.VFunktion
		);
	});

	// Get all (undeleted) remote Vorgänge
	const undeletedRemoteVorgänge = await sql`select * from vorgang`;

	// Get Vorgänge which are present on remote, but not present locally -> those should be removed
	console.log("Finding Vorgänge which should be deleted...");
	const remoteVorgängeToDelete = undeletedRemoteVorgänge.filter((rv) => {
		return (
			undeletedLocalVorgänge.filter((v) => v.VNr[0] === rv.vnr).length === 0
		);
	});

	// Get Vorgänge which are present locally, but not remote -> those should be added
	console.log("Finding Vorgänge which should be added...");
	const localVorgängeToAddToRemote = undeletedLocalVorgänge.filter((lv) => {
		return (
			undeletedRemoteVorgänge.filter((v) => v.vnr === lv.VNr[0]).length === 0
		);
	});

	// Deleting Vorgänge in database
	if (remoteVorgängeToDelete.length === 0) {
		console.log("No Vorgänge to delete in database...");
	} else {
		console.log(`Deleting Vorgänge in database...`);
		const progressBarDelete = new progress(":bar :current/:total", {
			total: remoteVorgängeToDelete.length,
		});
		for (const vorgang of remoteVorgängeToDelete) {
			await sql`delete from vorgang where vnr = ${vorgang.vnr}`;
			progressBarDelete.tick();
		}
		progressBarDelete.terminate();
	}

	// Adding Vorgänge to database
	if (localVorgängeToAddToRemote.length === 0) {
		console.log("No Vorgänge to add to database...");
	} else {
		console.log(`Adding local Vorgänge to database...`);
		const progressBarInsert = new progress(":bar :current/:total", {
			total: localVorgängeToAddToRemote.length,
		});
		for (const vorgang of localVorgängeToAddToRemote) {
			const vorgangResult = await sql`
					INSERT INTO vorgang (VNr, VFunktion, ReihNr, VTyp, VTypL, VSys, VSysL, VIR, export_id)
					VALUES (${checkIfArray(vorgang.VNr)}, ${checkIfArray(
						vorgang.VFunktion,
					)}, ${checkIfArray(vorgang.ReihNr)}, ${checkIfArray(
						vorgang.VTyp,
					)}, ${checkIfArray(vorgang.VTypL)}, ${checkIfArray(
						vorgang.VSys,
					)}, ${checkIfArray(vorgang.VSysL)}, ${checkIfArray(vorgang.VIR)}, ${
						dbExport[0].id
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
	}

	return;
}
