/* eslint-disable indent */
import progress from "progress";
import { ParDoks } from "./common.js";
import { connectDB } from "./sql.js";
import { insertVorgangs } from "./write-to-db.js";

export async function applyDiff(
	newParDoks: ParDoks,
	dbUrl: string,
	dryRun: boolean,
	allowDeletion: boolean,
) {
	const sql = connectDB(dbUrl);

	try {
		const dbExport = await sql`select * from export;`;
		if (!dbExport || dbExport.length === 0) {
			throw new Error("No export found in database.");
		}

		// Check if update times are okay
		const newPardoksUpdatedAt = new Date(
			newParDoks.Export.$.aktualisiert,
		).getTime();
		const remoteUpdatedAt = new Date(dbExport[0].aktualisiert).getTime();

		if (newPardoksUpdatedAt < remoteUpdatedAt) {
			throw new Error(
				`Export update time in database ${remoteUpdatedAt} is more recent than local update time ${newPardoksUpdatedAt}. Refusing to update.`,
			);
		}

		const updatedDiffDays =
			(newPardoksUpdatedAt - remoteUpdatedAt) / 1000 / 60 / 60 / 24;
		console.log(
			`Remote database is behind local file by ${Math.round(
				updatedDiffDays,
			)} days...`,
		);

		console.log("Loading local and remote Vorgangs...");
		// Get all undeleted local Vorgangs
		const undeletedLocalVorgangs = newParDoks.Export.Vorgang.filter((v) => {
			return (
				!v.VFunktion || v.VFunktion.length === 0 || v.VFunktion[0] !== "delete"
			);
		});

		// Get all (undeleted) remote Vorgangs
		const undeletedRemoteVorgangs = await sql`select * from vorgang`;

		// Get Vorgangs which are present on remote, but not present locally -> those should be removed
		console.log("Finding Vorgangs which should be deleted...");
		const remoteVorgangsToDelete = undeletedRemoteVorgangs.filter((rv) => {
			return (
				undeletedLocalVorgangs.filter((v) => v.VNr[0] === rv.vnr).length === 0
			);
		});

		// Get Vorgangs which are present locally, but not remote -> those should be added
		console.log("Finding Vorgangs which should be added...");
		const localVorgangsToAddToRemote = undeletedLocalVorgangs.filter((lv) => {
			return (
				undeletedRemoteVorgangs.filter((v) => v.vnr === lv.VNr[0]).length === 0
			);
		});

		if (dryRun) {
			console.log(`${remoteVorgangsToDelete.length} Vorgangs to delete`);
			console.log(`${localVorgangsToAddToRemote.length} Vorgangs to add`);
			process.exit(0)
		} else {
			if (allowDeletion) {
				// Deleting Vorgangs in database
				if (remoteVorgangsToDelete.length === 0) {
					console.log("No Vorgangs to delete in database...");
				} else {
					console.log(`Deleting Vorgangs in database...`);
					const progressBarDelete = new progress(":bar :current/:total", {
						total: remoteVorgangsToDelete.length,
					});
					for (const vorgang of remoteVorgangsToDelete) {
						await sql`delete from vorgang where vnr = ${vorgang.vnr}`;
						progressBarDelete.tick();
					}
					progressBarDelete.terminate();
				}
			}

			// Adding Vorgangs to database
			if (localVorgangsToAddToRemote.length === 0) {
				console.log("No Vorgangs to add to database...");
			} else {
				console.log(`Adding local Vorgangs to database...`);
				await insertVorgangs(localVorgangsToAddToRemote, dbExport[0].id, dbUrl);
			}

			// Set new update time to export
			await sql`update export set aktualisiert = ${newParDoks.Export.$.aktualisiert} where id = ${dbExport[0].id}`;
		}
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		sql.end();
	}

	return;
}
