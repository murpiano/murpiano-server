import type { Server } from "http";
import type { AddressInfo } from "net";
import { readFileSync } from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { useFixture } from "./test/fixture.js";

const { dataDir } = useFixture();
const { createApp } = await import("./app.js");

let server: Server;
let base: string;

const send = (method: string, url: string, body?: unknown) =>
  fetch(base + url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

const itemsOnDisk = () =>
  JSON.parse(readFileSync(path.join(dataDir, "demo", "items.json"), "utf-8"));

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe("root", () => {
  it("lists every project with the paths of its resources", async () => {
    const response = await send("GET", "/");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      projects: {
        demo: ["/demo/items"],
        "cloudpix-platform": ["/cloudpix-platform/data"],
      },
    });
  });
});

describe("generic routes", () => {
  it("lists a resource", async () => {
    const response = await send("GET", "/demo/items");
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveLength(2);
  });

  it("returns one record by id", async () => {
    const response = await send("GET", "/demo/items/a");
    expect(await response.json()).toEqual({ id: "a", title: "First" });
  });

  it("answers 404 for a missing record", async () => {
    expect((await send("GET", "/demo/items/nope")).status).toBe(404);
  });

  it("answers 404 for an unknown resource", async () => {
    expect((await send("GET", "/demo/unknown")).status).toBe(404);
  });

  it("creates a record with a generated id and saves it", async () => {
    const response = await send("POST", "/demo/items", { title: "Third" });
    const created = await response.json();

    expect(response.status).toBe(201);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(itemsOnDisk()).toContainEqual(created);
  });

  it("merges fields on PATCH", async () => {
    const response = await send("PATCH", "/demo/items/b", { done: true });
    expect(await response.json()).toEqual({
      id: "b",
      title: "Second",
      done: true,
    });
  });

  it("deletes a record", async () => {
    expect((await send("DELETE", "/demo/items/a")).status).toBe(204);
    expect(itemsOnDisk().some((item: { id: string }) => item.id === "a")).toBe(
      false,
    );
  });
});

describe("static files and custom routes", () => {
  it("serves files from public/", async () => {
    const response = await send("GET", "/public/demo/hello.txt");
    expect(await response.text()).toBe("hello");
  });

  it("lets a custom route reject a bad request before the generic routes", async () => {
    const response = await fetch(`${base}/cloudpix-platform/upload`, {
      method: "POST",
      body: new FormData(),
    });
    expect(response.status).toBe(400);
  });
});
