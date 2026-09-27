# murpiano-server

One small backend that serves the data for several frontend projects at once. It runs on
json-server with a few Express routers on top, written in TypeScript.

[Live API](https://murpiano-server.onrender.com/voyager-dashboard/points) · [How it works](#how-it-works) · [Run locally](#run-locally)

```text
$ curl https://murpiano-server.onrender.com/voyager-dashboard/points
[
  {
    "id": "05e4343b-20c8-4b2e-8710-87d6d5333c1c",
    "base_price": 1890,
    "date_from": "2026-04-10T14:07:05.444Z",
    "date_to": "2026-04-12T13:26:05.444Z",
    "destination": "e2984b72-2864-45bd-a7fb-dfddbcc7fceb",
    ...
```

The live instance is a free Render web service. It sleeps when idle, so the first request can
take up to a minute. Render's disk is not persistent: anything written through the API is gone
after a restart or a deploy, and the data falls back to what is committed in `data/`.

## What you can do

Point a frontend at `/<project>/<resource>` and get full CRUD over a JSON file without writing a
route. Add a project by dropping a folder of JSON files into `data/`. When a project needs more
than CRUD, give it its own router: CloudPix uploads photos through one, and Travel in Comfort
has login, favourites and comments behind a token.

Projects served right now:

- [CloudPix](https://github.com/murpiano/cloudpix-platform), a photo archive on a 3D sphere
- [Voyager Dashboard](https://github.com/murpiano/voyager-dashboard), a travel itinerary dashboard
- [Travel in Comfort](https://github.com/murpiano/travel-in-comfort), a rental listings app

## How it works

### Data on disk

On start, `src/shared/db/db-engine.ts` reads every `data/<project>/<resource>.json` into one
state object keyed by project, then resource. json-server wraps that object as its database.
Every write goes back to the same file through `saveToDisk`, so the JSON in `data/` is always
the current state and easy to inspect or reset with git.

### Generic routes

`src/shared/api/crud.conductor.ts` is a middleware that splits the path into project, resource
and id. If that resource exists in the state, it answers `GET`, `POST`, `PUT`, `PATCH` and
`DELETE` itself. A `POST` without an id gets `crypto.randomUUID()`. Anything it doesn't
recognise falls through to the json-server router.

This is why Voyager Dashboard needs no code here at all: three JSON files are enough.

### Project routers

Routes that need logic live in `src/entities/<project>` and are mounted in
`src/app/server.ts` before the generic middleware, so they win on the same path.

CloudPix gets `POST /cloudpix-platform/upload`. Multer saves the file to
`public/cloudpix-platform/uploads`, prefixing the name with the last six digits of the
timestamp. Multer reads non-ASCII file names as Latin-1, so the name is decoded again as
UTF-8 first, otherwise Cyrillic names turn into garbage.

Travel in Comfort gets offers with a "nearby" list (up to three offers from the same city),
login and logout, per-user favourites and comments. The token is the user's email in base64,
checked against the `X-Token` header.

### Static files

`/public` is served by Express. It holds the default CloudPix photos and avatars, and every
uploaded file.

## Run locally

```bash
git clone https://github.com/murpiano/murpiano-server.git
cd murpiano-server
npm install

npm run dev       # tsx watch on http://localhost:3001
npm run build     # tsc, then tsc-alias rewrites the @shared/@entities paths
npm start         # run the build from dist/
```

Needs Node 20 or newer. The port comes from `PORT` and defaults to 3001. Render sets `PORT`,
which is also how the server decides to print its public URL instead of localhost.

## Where things live

```text
data/                 one folder per project, one JSON file per resource
public/               static files and uploads, also per project
src/
├── app/server.ts     wires middleware and routers together
├── entities/         project-specific routers and types
└── shared/
    ├── api/          generic CRUD middleware
    ├── db/           load and save the JSON files
    ├── lib/          multer storage
    └── types/
```

Imports inside `src` use the `@shared/*` and `@entities/*` aliases from `tsconfig.json`, always
with an explicit `.js` extension, because the build runs as plain ES modules in Node.

## API

Base URL: `https://murpiano-server.onrender.com`

| Method                  | Path                                        | Notes                                                         |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| GET, POST               | `/<project>/<resource>`                     | any resource from `data/`                                     |
| GET, PUT, PATCH, DELETE | `/<project>/<resource>/<id>`                | ids compared as strings                                       |
| POST                    | `/cloudpix-platform/upload`                 | `multipart/form-data`, file in `filename`, plus `description` |
| GET                     | `/travel-in-comfort/offers/<id>/nearby`     | up to 3 offers from the same city                             |
| GET, POST               | `/travel-in-comfort/login`                  | `POST` takes `email` and `password`                           |
| DELETE                  | `/travel-in-comfort/logout`                 |                                                               |
| GET                     | `/travel-in-comfort/favorite`               | needs `X-Token`                                               |
| POST                    | `/travel-in-comfort/favorite/<id>/<0 or 1>` | needs `X-Token`                                               |
| GET, POST               | `/travel-in-comfort/comments/<id>`          | `POST` needs `X-Token`, takes `comment` and `rating`          |
| GET                     | `/public/...`                               | static files                                                  |

## Rough edges

- Nothing survives a restart on Render. Locally, everything is written straight into `data/`.
- Ids are compared as strings. CloudPix records have numeric ids, so
  `/cloudpix-platform/data/1` returns 404.
- The CloudPix upload stores only the file and `description`. The other form fields are
  ignored.
- Uploads have no size or type limit on the server side.
- Travel in Comfort keeps a single logged-in user. The password is not checked, and a new
  login replaces the previous one.
- `src/entities/voyager-dashboard` defines an empty router that is never mounted.
- There are no tests and no CI.

---

<sub>[murpiano](https://github.com/murpiano) · [Telegram](https://t.me/murpiano) · [MIT](LICENSE)</sub>
