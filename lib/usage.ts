export function usage() {
	console.log(
		`Usage: npx tsx index.ts -f <file> [-d <database-url>] [-h] [-p] [-v] [-w]
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
-u, --update-db\t\tUpdate the database based on a newer XML
--dry-run\t\tRuns the update-db script without committing the changes to the database, see output to check which Vorgangs would be added or deleted
--allow-deletion\t\tRuns the update-db script with explicitly saying that deleting Vorgangs is okay

Examples:

Write data to database using default database url postgres://postgres:postgres@localhost:5432/postgres

\tnpx tsx index.ts --file data/pardok-wp19.xml --write-to-db

---

Write data to json file and pretty print it

\tnpx tsx index.ts --pretty --file data/pardok-wp19.xml > data/pardok-wp19.json

--- 

Update database based on a newer XML:
\tnpx tsx index.ts -f wp19-new.xml -d postgres://postgres:postgres@localhost:54322/postgres --update-db --allow-deletion
`,
	);
	process.exit(0);
}
