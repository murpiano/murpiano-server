import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const items = [
  { id: "a", title: "First" },
  { id: "b", title: "Second" },
];

/**
 * Creates throwaway data/ and public/ folders with one project, `demo`,
 * and points the server at them. Call before importing anything that reads config.
 */
export const useFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "murpiano-server-"));
  const dataDir = path.join(root, "data");
  const publicDir = path.join(root, "public");

  mkdirSync(path.join(dataDir, "demo"), { recursive: true });
  writeFileSync(
    path.join(dataDir, "demo", "items.json"),
    JSON.stringify(items),
  );
  mkdirSync(path.join(publicDir, "demo"), { recursive: true });
  writeFileSync(path.join(publicDir, "demo", "hello.txt"), "hello");
  cpSync(
    path.resolve("data", "cloudpix-platform"),
    path.join(dataDir, "cloudpix-platform"),
    {
      recursive: true,
    },
  );

  process.env.DATA_DIR = dataDir;
  process.env.PUBLIC_DIR = publicDir;
  return { dataDir, publicDir };
};
