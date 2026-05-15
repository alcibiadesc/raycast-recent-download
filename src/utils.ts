import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { Icon, Color } from "@raycast/api";

export type ItemKind = "file" | "folder";

export interface DownloadItem {
  path: string;
  name: string;
  size: number;
  lastModifiedAt: Date;
  kind: ItemKind;
  sourceFolder: string;
}

export type SortKey = "date" | "name" | "size";
export type FilterKind = "all" | "file" | "folder";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".heic", ".tiff"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"]);
const ARCHIVE_EXTS = new Set([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".dmg", ".pkg"]);
const CODE_EXTS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".rs", ".go", ".java", ".c", ".cpp", ".h",
  ".rb", ".php", ".swift", ".kt", ".sh", ".json", ".yaml", ".yml", ".toml", ".html", ".css", ".scss",
]);
const DOC_EXTS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".rtf", ".csv"]);

export function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

export function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i <= 0 ? "" : name.slice(i).toLowerCase();
}

export function iconForItem(item: DownloadItem): { source: Icon; tintColor?: Color } {
  if (item.kind === "folder") return { source: Icon.Folder, tintColor: Color.Blue };
  const ext = getExtension(item.name);
  if (IMAGE_EXTS.has(ext)) return { source: Icon.Image, tintColor: Color.Purple };
  if (VIDEO_EXTS.has(ext)) return { source: Icon.Video, tintColor: Color.Red };
  if (AUDIO_EXTS.has(ext)) return { source: Icon.Music, tintColor: Color.Magenta };
  if (ARCHIVE_EXTS.has(ext)) return { source: Icon.Box, tintColor: Color.Orange };
  if (CODE_EXTS.has(ext)) return { source: Icon.Code, tintColor: Color.Green };
  if (DOC_EXTS.has(ext)) return { source: Icon.Document, tintColor: Color.Yellow };
  return { source: Icon.Document };
}

export function isImage(name: string): boolean {
  return IMAGE_EXTS.has(getExtension(name));
}

const TEXT_EXTS = new Set([
  ...CODE_EXTS,
  ".txt", ".md", ".log", ".env", ".gitignore", ".csv", ".xml", ".svg", ".ini", ".conf",
]);

const LANG_MAP: Record<string, string> = {
  ".js": "javascript", ".jsx": "jsx", ".ts": "typescript", ".tsx": "tsx",
  ".py": "python", ".rs": "rust", ".go": "go", ".java": "java",
  ".c": "c", ".cpp": "cpp", ".h": "c", ".rb": "ruby", ".php": "php",
  ".swift": "swift", ".kt": "kotlin", ".sh": "bash", ".json": "json",
  ".yaml": "yaml", ".yml": "yaml", ".toml": "toml", ".html": "html",
  ".css": "css", ".scss": "scss", ".md": "markdown", ".xml": "xml",
  ".csv": "csv", ".sql": "sql",
};

const MAX_TEXT_PREVIEW_BYTES = 16_384;

export function isText(name: string): boolean {
  return TEXT_EXTS.has(getExtension(name));
}

export function languageFor(name: string): string {
  return LANG_MAP[getExtension(name)] ?? "";
}

export async function readTextPreview(path: string): Promise<string> {
  const handle = await fs.open(path, "r");
  try {
    const buf = Buffer.alloc(MAX_TEXT_PREVIEW_BYTES);
    const { bytesRead } = await handle.read(buf, 0, MAX_TEXT_PREVIEW_BYTES, 0);
    return buf.subarray(0, bytesRead).toString("utf8");
  } finally {
    await handle.close();
  }
}

export async function listFolderPreview(
  path: string,
  limit = 20
): Promise<{ entries: { name: string; isDir: boolean }[]; total: number }> {
  const entries = await fs.readdir(path, { withFileTypes: true });
  const mapped = entries.map((e) => ({ name: e.name, isDir: e.isDirectory() }));
  mapped.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
  return { entries: mapped.slice(0, limit), total: mapped.length };
}

async function folderSize(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const p = join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            total += await folderSize(p);
          } else if (entry.isFile()) {
            const st = await fs.stat(p);
            total += st.size;
          }
        } catch {
          // ignore unreadable entries
        }
      })
    );
  } catch {
    // ignore unreadable directory
  }
  return total;
}

export async function getRecentItems(
  folderPath: string,
  options: { includeFolders: boolean; computeFolderSize: boolean }
): Promise<DownloadItem[]> {
  const resolved = expandHome(folderPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });

  const items = await Promise.all(
    entries.map(async (entry): Promise<DownloadItem | null> => {
      const path = join(resolved, entry.name);
      try {
        const stats = await fs.stat(path);
        const isDir = stats.isDirectory();
        if (isDir && !options.includeFolders) return null;
        const size = isDir && options.computeFolderSize ? await folderSize(path) : stats.size;
        return {
          path,
          name: entry.name,
          size,
          lastModifiedAt: new Date(stats.mtimeMs),
          kind: isDir ? "folder" : "file",
          sourceFolder: resolved,
        };
      } catch {
        return null;
      }
    })
  );

  return items.filter((x): x is DownloadItem => x !== null);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function dateBucket(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = date.getTime();
  const dayMs = 86_400_000;

  if (ts >= today) return "Today";
  if (ts >= today - dayMs) return "Yesterday";
  if (ts >= today - 7 * dayMs) return "This Week";
  if (ts >= today - 30 * dayMs) return "This Month";
  if (ts >= today - 365 * dayMs) return "This Year";
  return "Older";
}

export const BUCKET_ORDER = ["Today", "Yesterday", "This Week", "This Month", "This Year", "Older"];

export function compareItems(a: DownloadItem, b: DownloadItem, sortKey: SortKey): number {
  switch (sortKey) {
    case "name":
      return a.name.localeCompare(b.name);
    case "size":
      return b.size - a.size;
    case "date":
    default:
      return b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime();
  }
}
