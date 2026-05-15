import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  getPreferenceValues,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  trash,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import {
  getRecentItems,
  DownloadItem,
  SortKey,
  FilterKind,
  formatBytes,
  iconForItem,
  dateBucket,
  BUCKET_ORDER,
  compareItems,
  expandHome,
} from "./utils";
import { ItemDetail } from "./ItemDetail";
import { basename } from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);

async function revealForDrag(path: string) {
  try {
    await execFileP("osascript", [
      "-e",
      `tell application "Finder" to reveal (POSIX file "${path.replace(/"/g, '\\"')}" as alias)`,
      "-e",
      `tell application "Finder" to activate`,
    ]);
  } catch (err) {
    await showToast({ style: Toast.Style.Failure, title: "Could not open Finder", message: String(err) });
  }
}

interface Preferences {
  folder1: string;
  folder2?: string;
  folder3?: string;
  folder4?: string;
  folder5?: string;
  includeFolders?: boolean;
  computeFolderSize?: boolean;
  maxItems?: string;
}

export default function RecentDownloads() {
  const prefs = getPreferenceValues<Preferences>();
  const includeFolders = prefs.includeFolders ?? true;
  const computeFolderSize = prefs.computeFolderSize ?? false;
  const maxItems = Math.max(10, parseInt(prefs.maxItems ?? "200", 10) || 200);

  const folders = useMemo(
    () =>
      [prefs.folder1, prefs.folder2, prefs.folder3, prefs.folder4, prefs.folder5]
        .filter((f): f is string => Boolean(f))
        .map(expandHome),
    [prefs.folder1, prefs.folder2, prefs.folder3, prefs.folder4, prefs.folder5]
  );

  const [showHidden, setShowHidden] = useState(false);
  const [filterKind, setFilterKind] = useState<FilterKind>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const { data, isLoading, revalidate, mutate } = usePromise(
    async (foldersArg: string[]) => {
      const results = await Promise.all(
        foldersArg.map(async (folder) => {
          try {
            return await getRecentItems(folder, { includeFolders, computeFolderSize });
          } catch (err) {
            console.error(`Error reading ${folder}:`, err);
            return [];
          }
        })
      );
      return results.flat();
    },
    [folders]
  );

  const items = data ?? [];

  const filteredSorted = useMemo(() => {
    let out = items;
    if (!showHidden) out = out.filter((i) => !i.name.startsWith("."));
    if (filterKind !== "all") out = out.filter((i) => i.kind === filterKind);
    return [...out].sort((a, b) => compareItems(a, b, sortKey));
  }, [items, showHidden, filterKind, sortKey]);

  const limited = filteredSorted.slice(0, maxItems);

  const grouped = useMemo(() => {
    if (sortKey !== "date") return null;
    const buckets = new Map<string, DownloadItem[]>();
    for (const item of limited) {
      const key = dateBucket(item.lastModifiedAt);
      const list = buckets.get(key) ?? [];
      list.push(item);
      buckets.set(key, list);
    }
    return BUCKET_ORDER.filter((b) => buckets.has(b)).map((b) => ({ name: b, items: buckets.get(b) ?? [] }));
  }, [limited, sortKey]);

  const totalSize = useMemo(() => filteredSorted.reduce((acc, i) => acc + i.size, 0), [filteredSorted]);

  async function handleTrashSingle(item: DownloadItem) {
    try {
      await trash(item.path);
      await mutate(undefined, {
        optimisticUpdate: (current) => (current ?? []).filter((x) => x.path !== item.path),
        shouldRevalidateAfter: false,
      });
      await showToast({ style: Toast.Style.Success, title: "Moved to Trash", message: item.name });
    } catch (err) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to delete", message: String(err) });
    }
  }

  async function handleTrashAll() {
    if (limited.length === 0) return;
    const confirmed = await confirmAlert({
      title: `Move ${limited.length} item(s) to Trash?`,
      message: "This affects every visible item in the current view.",
      primaryAction: { title: "Move to Trash", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    try {
      await trash(limited.map((i) => i.path));
      await mutate(undefined, {
        optimisticUpdate: (current) => (current ?? []).filter((x) => !limited.some((l) => l.path === x.path)),
        shouldRevalidateAfter: false,
      });
      await showToast({ style: Toast.Style.Success, title: `Moved ${limited.length} item(s) to Trash` });
    } catch (err) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to delete", message: String(err) });
    }
  }

  function renderItem(item: DownloadItem) {
    const icon = iconForItem(item);

    const accessories: List.Item.Accessory[] = [
      { text: formatBytes(item.size) },
      { date: item.lastModifiedAt, tooltip: item.lastModifiedAt.toLocaleString() },
    ];
    if (folders.length > 1) {
      accessories.unshift({ tag: { value: basename(item.sourceFolder), color: Color.SecondaryText } });
    }

    return (
      <List.Item
        key={item.path}
        title={item.name}
        icon={icon}
        accessories={accessories}
        quickLook={{ path: item.path, name: item.name }}
        detail={<ItemDetail item={item} />}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <Action.Open title={item.kind === "folder" ? "Open Folder" : "Open File"} target={item.path} />
              <Action.ShowInFinder shortcut={{ modifiers: ["cmd"], key: "o" }} path={item.path} />
              <Action.ToggleQuickLook title="Preview" shortcut={{ modifiers: ["shift"], key: "space" }} />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action.CopyToClipboard
                title={item.kind === "folder" ? "Copy Folder" : "Copy File"}
                content={{ file: item.path }}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
              />
              <Action.Paste
                title="Paste into Frontmost App"
                content={{ file: item.path }}
                shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
              />
              <Action.OpenWith
                path={item.path}
                shortcut={{ modifiers: ["cmd"], key: "p" }}
              />
              <Action
                title="Reveal in Finder & Activate"
                icon={Icon.Finder}
                shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
                onAction={() => revealForDrag(item.path)}
              />
              <Action.CopyToClipboard
                title="Copy Path"
                content={item.path}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy as Markdown Link"
                content={`[${item.name}](file://${item.path.split("/").map(encodeURIComponent).join("/")})`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
              />
              <Action.CopyToClipboard
                title="Copy Name"
                content={item.name}
                shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
              />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action
                title="Move to Trash"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={() => handleTrashSingle(item)}
              />
              <Action
                title="Move All Visible to Trash"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                onAction={handleTrashAll}
              />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action
                title={showHidden ? "Hide Hidden Files" : "Show Hidden Files"}
                icon={showHidden ? Icon.EyeDisabled : Icon.Eye}
                shortcut={{ modifiers: ["shift"], key: "h" }}
                onAction={() => setShowHidden((v) => !v)}
              />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => revalidate()}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder={`Filter ${filteredSorted.length} item(s) • ${formatBytes(totalSize)}`}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter & Sort"
          storeValue
          onChange={(value) => {
            const [kind, sort] = value.split(":") as [FilterKind, SortKey];
            setFilterKind(kind);
            setSortKey(sort);
          }}
          defaultValue="all:date"
        >
          <List.Dropdown.Section title="Show">
            <List.Dropdown.Item title="All • by Date" value="all:date" icon={Icon.Calendar} />
            <List.Dropdown.Item title="All • by Name" value="all:name" icon={Icon.Text} />
            <List.Dropdown.Item title="All • by Size" value="all:size" icon={Icon.HardDrive} />
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Files only">
            <List.Dropdown.Item title="Files • by Date" value="file:date" icon={Icon.Document} />
            <List.Dropdown.Item title="Files • by Size" value="file:size" icon={Icon.Document} />
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Folders only">
            <List.Dropdown.Item title="Folders • by Date" value="folder:date" icon={Icon.Folder} />
            <List.Dropdown.Item title="Folders • by Size" value="folder:size" icon={Icon.Folder} />
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {limited.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Tray}
          title="No items"
          description="No files or folders match your filters."
        />
      ) : grouped ? (
        grouped.map((g) => (
          <List.Section key={g.name} title={g.name} subtitle={`${g.items.length}`}>
            {g.items.map(renderItem)}
          </List.Section>
        ))
      ) : (
        limited.map(renderItem)
      )}
    </List>
  );
}
