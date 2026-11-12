import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

export async function readDoc(name: string) {
  return readFile(path.join(process.cwd(), "docs", name), "utf8");
}

export const mdToHtml = (md: string) => marked.parse(md, { async: false }) as string;
