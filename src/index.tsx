import { List, ActionPanel, Action, Detail, Icon, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { extname } from "path";
import { PathLike } from "fs";
import { getRecentDownloads, Download, getFileTypeIcon, formatBytes } from "./utils";

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
    async function fetchDownloads() {
      const allDownloads: Download[] = [];
      const folders = [
        preferences.folder1,
        preferences.folder2,
        preferences.folder3,
        preferences.folder4,
        preferences.folder5,
      ].filter(Boolean) as string[];

      for (const folder of folders) {
        try {
          const downloads = await getRecentDownloads(folder);
          allDownloads.push(...downloads);
        } catch (error) {
          console.error(`Error getting recent files from folder ${folder}:`, error);
        }
      }

      allDownloads.sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime());

      const filteredDownloads = showHiddenFiles
        ? allDownloads
        : allDownloads.filter((download) => !download.name.startsWith("."));

      setDownloads(filteredDownloads);
    }

    fetchDownloads();
  }, [preferences, showHiddenFiles]);

  function toggleHiddenFiles() {
    setShowHiddenFiles(!showHiddenFiles);
  }

  function handleTrash(paths: PathLike | PathLike[]) {
    setDownloads((downloads) =>
      downloads.filter((download) => (Array.isArray(paths) ? !paths.includes(download.path) : paths !== download.path))
    );
  }

  if (selectedDownload) {
    const fileExtension = extname(selectedDownload.name);
    return (
      <Detail
        navigationTitle={selectedDownload.name}
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.Label title="File Type" text={fileExtension} />
          </Detail.Metadata>
        }
      />
    );
  }

  function getHiddenFilesInfo() {
    if (showHiddenFiles) {
      return {
        icon: Icon.EyeDisabled,
        text: "Hide hidden files",
      };
    } else {
      return {
        icon: Icon.Eye,
        text: "Show hidden files",
      };
    }
  }

  return (
    <List isShowingDetail searchBarPlaceholder="Filter files...">
      {downloads.map((download) => {
        const fileExtension = extname(download.name);
        const icon = getFileTypeIcon(fileExtension);

        function getPreview(filePath: string, fileExtension: string) {
          const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"];

          const height = 180;

          if (imageExtensions.includes(fileExtension)) {
            return `<img src="${filePath}" alt="Image" height="${height}" />`;
          } else {
            const icon = getFileTypeIcon(fileExtension);

            return `<img src="${icon}" alt="Image" height="${height}" />`;
          }
        }

        return (
          <List.Item
            key={download.path}
            title={download.name}
            quickLook={{ path: download.path, name: download.name }}
            detail={
              <List.Item.Detail
                markdown={getPreview(download.path, fileExtension)}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Title" text={`${download.name} `} />
                    <List.Item.Detail.Metadata.Label title="File Type" text={fileExtension} icon={icon} />
                    <List.Item.Detail.Metadata.Label title="Size" text={formatBytes(download.size)} />
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label
                      title="Last Modified"
                      text={download.lastModifiedAt.toLocaleString()}
                    />
                    <List.Item.Detail.Metadata.Label title="Location" text={download.path} />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action.Open title="Open File" target={download.path} />
                <Action
                  title={getHiddenFilesInfo().text}
                  icon={getHiddenFilesInfo().icon}
                  shortcut={{ modifiers: ["cmd"], key: "h" }}
                  onAction={toggleHiddenFiles}
                />
                <Action.CopyToClipboard
                  title="Copy File"
                  content={{ file: download.path }}
                  shortcut={{ modifiers: ["cmd"], key: "enter" }}
                />
                <Action.ShowInFinder shortcut={{ modifiers: ["cmd"], key: "o" }} path={download.path} />

                <Action.ToggleQuickLook title="Preview File" shortcut={{ modifiers: ["shift"], key: "space" }} />
                <Action.Trash
                  title="Delete File"
                  paths={[download.path]}
                  shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                  onTrash={handleTrash}
                />
                <Action.Trash
                  title="Delete All"
                  paths={downloads.map((download) => download.path)}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                  onTrash={() => setDownloads([])}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
