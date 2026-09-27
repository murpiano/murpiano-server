import { readFileSync } from "fs";
import path from "path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { useFixture } from "../test/fixture.js";

const { dataDir } = useFixture();
const { buildDatabase, saveToDisk } = await import("./store.js");

beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("buildDatabase", () => {
  it("reads every project folder and JSON file", () => {
    const db = buildDatabase();
    expect(Object.keys(db)).toContain("demo");
    expect(db.demo.items).toHaveLength(2);
  });
});

describe("saveToDisk", () => {
  it("writes a resource back to its file", () => {
    saveToDisk("demo", "items", [{ id: "c" }]);
    const saved = JSON.parse(
      readFileSync(path.join(dataDir, "demo", "items.json"), "utf-8"),
    );
    expect(saved).toEqual([{ id: "c" }]);
  });

  it("creates the project folder when it is missing", () => {
    saveToDisk("fresh", "notes", []);
    expect(
      readFileSync(path.join(dataDir, "fresh", "notes.json"), "utf-8"),
    ).toBe("[]");
  });
});
