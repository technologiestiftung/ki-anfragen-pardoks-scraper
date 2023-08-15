// @ts-check
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { parseStringPromise } from "xml2js";
import { ParDoks } from "./lib/common.js";
import { db } from "./lib/db.js";

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
			"database-url": {
				type: "string",
				short: "d",
			},
			file: {
				type: "string",
				short: "f",
			},
		},
	});

	if (values.version) {
		console.log(JSON.parse(await readFile("./package.json", "utf-8")).version);
		process.exit(0);
	}
	// write the help output that explasins how to use the program
	if (values.help) {
		help();
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
	const json = (await parseStringPromise(xml, {
		explicitArray: true,
	})) as ParDoks;

	if (!values["write-to-db"]) {
		if (values.pretty) {
			console.log(JSON.stringify(json, null, 2));
		} else {
			console.log(JSON.stringify(json));
		}
	} else {
		//  uses the value from values[database-url]. If this is not check if the environment variable DATABASE_URL is set. If this is not set use the default value

		let DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";
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
			await db({
				parDoks: json,
				url: DATABASE_URL,
				filename: basename(values.file),
			});
		}
	}
} catch (error: unknown) {
	if (error instanceof TypeError) {
		if (Object.hasOwnProperty.call(error, "code")) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			if (error.code === "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL") {
				console.error(error.message);
				process.exit(1);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
			} else if (error.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE") {
				console.error(error.message);

				process.exit(1);
			} else {
				console.error(error);
			}
		}
	}
	help();
}
function help() {
	console.log(
		`Usage: node index.js -f <file> [-d <database-url>] [-h] [-p] [-v] [-w]
Options:
-d, --database-url <url>\tURL of the database to connect to
\t\t\t\t(default: postgres://postgres:postgres@localhost:5432/postgres).
\t\t\t\tTries to use the DATABASE_URL environment variable
\t\t\t\tif write-to-db is true and no url is provided
-f, --file <path>\t\tPath to the XML file to parse (required)
-h, --help\t\t\tPrint this help message and exit 0
-p, --pretty\t\t\tPretty-print the output JSON (only if not wirting to db)
-v, --version\t\t\tPrint the version number and exit 0
-w, --write-to-db\t\tWrite the parsed data to the database

Examples:

Write data to database using default database url postgres://postgres:postgres@localhost:5432/postgres

\tnode index.js --file data/pardok-wp19.xml --write-to-db

---

Write data to json file and pretty print it

\tnode index.js --pretty --file data/pardok-wp19.xml > data/pardok-wp19.json

`,
	);
	process.exit(0);
}
