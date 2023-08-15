# Docs Scraper for KI-Anfrage

![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END  -->

## Prerequisites

- [Node.js](https://nodejs.org/en/) (>= 18.0.0)
- Supabase project (ar at least a Postgres data base) see https://github.com/technologiestiftung/ki-anfragen-supabase

## Installation

```bash
npm ci
```

## Usage

```plain
Usage: npx tsx index.ts -f <file> [-d <database-url>] [-h] [-p] [-v] [-w]
Options:
-d, --database-url <url>	URL of the database to connect to
				(default: postgres://postgres:postgres@localhost:5432/postgres).
				Tries to use the DATABASE_URL environment variable
				if write-to-db is true and no url is provided
-f, --file <path>		Path to the XML file to parse (required)
-h, --help			Print this help message and exit 0
-p, --pretty			Pretty-print the output JSON (only if not wirting to db)
-v, --version			Print the version number and exit 0
-w, --write-to-db		Write the parsed data to the database

Examples:

Write data to database using default database url postgres://postgres:postgres@localhost:5432/postgres

	node index.js --file data/pardok-wp19.xml --write-to-db

---

Write data to json file and pretty print it

	node index.js --pretty --file data/pardok-wp19.xml > data/pardok-wp19.json
```

## Development

## Tests

tbd...

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

## Credits

<table>
  <tr>
    <td>
      Made by <a href="https://citylab-berlin.org/de/start/">
        <br />
        <br />
        <img width="200" src="https://logos.citylab-berlin.org/logo-citylab-berlin.svg" />
      </a>
    </td>
    <td>
      A project by <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/rbmskzl/">
        <br />
        <br />
        <img width="80" src="https://logos.citylab-berlin.org/logo-berlin-senatskanzelei-de.svg" />
      </a>
    </td>
  </tr>
</table>

## Related Projects
