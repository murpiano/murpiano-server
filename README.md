![murpiano-server](public/img/app-screenshot.jpg)

# murpiano-server

A small backend that several frontend projects share. It runs on json-server with Express
routers on top, written in TypeScript.

[![CI](https://github.com/murpiano/murpiano-server/actions/workflows/ci.yml/badge.svg)](https://github.com/murpiano/murpiano-server/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/murpiano/murpiano-server?color=informational)](https://github.com/murpiano/murpiano-server/releases/latest)

[Live API](https://murpiano-server.onrender.com) · [How it works](#how-it-works) · [Run locally](#run-locally)

The live instance is a free Render web service. It sleeps when idle, so the first request can
take up to a minute. Render's disk is not persistent: anything written through the API is gone
after a restart or a deploy, and the data falls back to what is committed in `data/`.

## What you can do

Give a project a folder in `data/` with one JSON file per resource, and it gets a REST API
without a single line of server code:

```text
data/<project>/<resource>.json    GET, POST              /<project>/<resource>
                                  GET, PUT, PATCH, DELETE /<project>/<resource>/<id>
public/<project>/...              GET                    /public/<project>/...
```

Most projects need nothing else. When a task doesn't fit plain CRUD (a file upload, a login,
a filtered list), write a route for it in `src/projects/<project>/`.

## How it works

### Data on disk

On start, `src/core/store.ts` reads every `data/<project>/<resource>.json` into one state
object keyed by project, then resource. json-server wraps that object as its database. Every
write goes back to the same file, so the JSON in `data/` is always the current state and easy
to inspect or reset with git.

### Generic routes

`src/core/crud.ts` is a middleware that splits the path into project, resource and id. If that
resource exists, it answers `GET`, `POST`, `PUT`, `PATCH` and `DELETE` itself. A `POST` without
an id gets `crypto.randomUUID()`. Anything it doesn't recognise falls through to the
json-server router.

### Custom routes

A project's own routes live in `src/projects/<project>/routes.ts`. They are mounted in
`src/app.ts` before the generic middleware, so a custom route wins on the same path and the
rest of the project still gets CRUD for free.

For uploads there is a ready multer storage in `src/core/upload.ts`. It saves files to
`public/<project>/uploads` with a short timestamp prefix. Multer reads non-ASCII file names as
Latin-1, so the name is decoded again as UTF-8 first, otherwise Cyrillic names turn into
garbage.

## Run locally

```bash
git clone https://github.com/murpiano/murpiano-server.git
cd murpiano-server
npm install

npm run dev       # tsx watch on http://localhost:3001
npm test          # vitest
npm run check     # type check and tests
npm run build     # compile to dist/
npm start         # run the build
```

Needs Node 22.12 or newer.

| Variable     | Default  | Purpose                                             |
| ------------ | -------- | --------------------------------------------------- |
| `PORT`       | `3001`   | Port to listen on. Render sets it.                  |
| `DATA_DIR`   | `data`   | Folder with the JSON files.                         |
| `PUBLIC_DIR` | `public` | Folder served under `/public` and used for uploads. |

Tests sit next to the code as `*.test.ts`. They start the app on a random port against a
temporary copy of the data, so `data/` stays untouched. CI runs the type check, the tests and
the build on pushes to `main` and on pull requests (`.github/workflows/ci.yml`).

## Where things live

```text
data/                     one folder per project, one JSON file per resource
public/                   static files and uploads, also per project
src/
├── server.ts             starts listening
├── app.ts                builds the app: middleware, custom routes, generic CRUD
├── config.ts             port, public URL, folders
├── core/                 JSON store, generic CRUD, upload storage
└── projects/<project>/   custom routes and types of one project
```

Nothing in `core/` knows about any project. Adding a project means a folder in `data/` and,
only if it needs custom routes, a folder in `projects/` plus one line in `app.ts`. `app.ts`
builds the app without starting it, which is what the tests use.

## API

Base URL: `https://murpiano-server.onrender.com`

| Method                  | Path                         | Notes                                       |
| ----------------------- | ---------------------------- | ------------------------------------------- |
| GET                     | `/`                          | every project with its resource paths       |
| GET, POST               | `/<project>/<resource>`      | any resource from `data/`                   |
| GET, PUT, PATCH, DELETE | `/<project>/<resource>/<id>` | ids compared as strings                     |
| GET                     | `/public/<path>`             | static files                                |
| any                     | `/<project>/...`             | custom routes from `src/projects/<project>` |

## Rough edges

- Nothing survives a restart on Render. Locally, everything is written straight into `data/`.
- Ids are compared as strings, so records with numeric ids can't be fetched by id through the
  generic routes.
- The generic routes have no auth. Anyone who knows a path can change the data.
- The upload storage has no size or type limit.

---

<sub>[Bogdan Trotsenko](https://github.com/murpiano) · [murpiano](https://github.com/murpiano) · [Telegram](https://t.me/murpiano) · [MIT](LICENSE)</sub>
