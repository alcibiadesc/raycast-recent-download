import { promises as fs } from "fs";
import { join } from "path";

export interface Download {
  path: string;
  name: string;
  size: number;
  lastModifiedAt: Date;
  icon: string;
}

export async function getRecentDownloads(downloadsPath: string): Promise<Download[]> {
  const files = await fs.readdir(downloadsPath);
  const downloads: Download[] = [];

  for (const file of files) {
    const path = join(downloadsPath, file);
    const stats = await fs.stat(path);
    const fileExtension = getFileExtension(file);
    const icon = await getFileTypeIcon(fileExtension);
    if (!stats.isDirectory()) {
      downloads.push({
        path,
        name: file,
        size: stats.size,
        lastModifiedAt: new Date(stats.mtimeMs),
        icon,
      });
    }
  }

  return downloads;
}

export function getFileExtension(filename: string): string {
  return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

export async function getFileTypeIcon(fileExtension: string): Promise<string> {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"];
  if (imageExtensions.includes(fileExtension.toLowerCase())) {
    return "image";
  } else {
    return "";
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
