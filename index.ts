// @ts-check
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { write2DB } from "./lib/write-to-db.js";
import { usage } from "./lib/usage.js";
import { parseXML2JSON } from "./lib/parse-xml-to-json.js";
import { applyDiff } from "./lib/apply-diff.js";

try {
	const { values } = parseArgs({
		options: {
			version: {
				short: "v",
				type: "boolean",
			},
			help: {
				type: "boolean",
				short: "h",
			},
			pretty: {
				type: "boolean",
				short: "p",
			},
			"write-to-db": {
				type: "boolean",
				short: "w",
			},
			"update-db": {
				type: "boolean",
				short: "u",
			},
			"database-url": {
				type: "string",
				short: "d",
			},
			file: {
				type: "string",
				short: "f",
			},
			"dry-run": {
				type: "boolean",
			},
		},
	});

	if (values.version) {
		console.log(JSON.parse(await readFile("./package.json", "utf-8")).version);
		process.exit(0);
	}
	// write the help output that explasins how to use the program
	if (values.help) {
		usage();
	}

	// check if the file provided by te user via the flag -f exsists
	if (values.file) {
		if (!existsSync(values.file)) {
			console.error("xml file does not exist");
			process.exit(1);
		}
	} else {
		console.error("No file provided");
		process.exit(1);
	}

	const xml = await readFile(values.file, "utf-8");
	const json = await parseXML2JSON(xml);

	if (values["update-db"]) {
		if (!values["database-url"]) {
			console.error("No database url provided via flag --database-url");
			process.exit(1);
		}
		await applyDiff(json, values["database-url"]!, values["dry-run"]!);
		process.exit(0);
	} else {
		if (!values["write-to-db"]) {
			if (values.pretty) {
				console.log(JSON.stringify(json, null, 2));
			} else {
				console.log(JSON.stringify(json));
			}
		} else {
			//  uses the value from values[database-url]. If this is not check if the environment variable DATABASE_URL is set. If this is not set use the default value

			let DATABASE_URL =
				"postgres://postgres:postgres@localhost:54322/postgres";
			if (values["write-to-db"]) {
				if (!values["database-url"]) {
					console.warn("No database url provided via flag --database-url");
					console.warn("Trying to use DATABASE_URL environment variable");
					if (!process.env.DATABASE_URL) {
						console.warn("No DATABASE_URL environment variable provided");
						console.warn(
							"Will try default value of postgres://postgres:postgres@localhost:5432/postgres",
						);
					} else {
						DATABASE_URL = process.env.DATABASE_URL;
					}
				} else {
					DATABASE_URL = values["database-url"];
				}
				await write2DB({
					parDoks: json,
					url: DATABASE_URL,
					filename: basename(values.file),
				});
				process.exit(0);
			}
		}
	}
} catch (error: unknown) {
	if (error instanceof TypeError) {
		if (Object.hasOwnProperty.call(error, "code")) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			if (error.code === "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL") {
				console.error(error.message);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
			} else if (error.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE") {
				console.error(error.message);
			} else {
				console.error(error);
			}
		}
		process.exit(1);
	}
	usage();
	process.exit(1); // Exit with error for CI usage
}
