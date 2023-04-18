import { promises as fs } from "fs";
import { join } from "path";
import { FileTypeColors, FileTypeIcons } from "./fileTypes";

export interface Download {
  path: string;
  name: string;
  size: number;
  lastModifiedAt: Date;
}

export async function getRecentDownloads(downloadsPath: string): Promise<Download[]> {
  const files = await fs.readdir(downloadsPath);
  const downloads: Download[] = [];

  for (const file of files) {
    const path = join(downloadsPath, file);
    const stats = await fs.stat(path);
    if (!stats.isDirectory()) {
      downloads.push({
        path,
        name: file,
        size: stats.size,
        lastModifiedAt: new Date(stats.mtimeMs),
      });
    }
  }

  return downloads;
}

export async function getFileTypeIcon(fileExtension: string): Promise<string> {
  const iconName = FileTypeIcons[fileExtension] ?? "default";
  const iconPath = join(__dirname, "assets", "filetype-icon", `${iconName}.png`);

  try {
    await fs.access(iconPath);
    return iconPath;
  } catch (error) {
    // No warning will be shown if the icon is not found, and the default icon will be used silently
    const defaultIconPath = join(__dirname, "assets", "filetype-icon", "_page.png");
    return defaultIconPath;
  }
}

export function getFileTypeColor(fileExtension: string): string {
  return FileTypeColors[fileExtension] ?? "#999999";
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
