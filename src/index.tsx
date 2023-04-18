
import { List, ActionPanel, Action, Detail, Icon, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { extname } from "path";
import { PathLike } from "fs";
import { getRecentDownloads, Download, formatBytes } from "./utils";

interface Preferences {
  folder1: string;
  folder2?: string;
  folder3?: string;
  folder4?: string;
  folder5?: string;
}

export default function RecentDownloads() {
  const preferences = getPreferenceValues<Preferences>();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [selectedDownload] = useState<Download | null>(null);
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDownloads
