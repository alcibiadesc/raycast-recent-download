import { List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import {
  DownloadItem,
  formatBytes,
  getExtension,
  isImage,
  isText,
  languageFor,
  readTextPreview,
  listFolderPreview,
} from "./utils";

interface Props {
  item: DownloadItem;
}

export function ItemDetail({ item }: Props) {
  const ext = getExtension(item.name);

  const { data: markdown, isLoading } = usePromise(
    async (i: DownloadItem) => buildMarkdown(i),
    [item],
    { failureToastOptions: { title: "Preview failed" } }
  );

  return (
    <List.Item.Detail
      isLoading={isLoading}
      markdown={markdown ?? ""}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Name" text={item.name} />
          <List.Item.Detail.Metadata.Label title="Type" text={item.kind === "folder" ? "Folder" : ext || "File"} />
          <List.Item.Detail.Metadata.Label title="Size" text={formatBytes(item.size)} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Modified" text={item.lastModifiedAt.toLocaleString()} />
          <List.Item.Detail.Metadata.Label title="Location" text={item.path} />
          <List.Item.Detail.Metadata.Label title="Source" text={item.sourceFolder} />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

async function buildMarkdown(item: DownloadItem): Promise<string> {
  if (item.kind === "folder") {
    try {
      const { entries, total } = await listFolderPreview(item.path);
      if (entries.length === 0) return `*Empty folder*`;
      const lines = entries.map((e) => `- ${e.isDir ? "📁" : "📄"} ${e.name}`);
      const more = total > entries.length ? `\n\n*…and ${total - entries.length} more*` : "";
      return `### Contents (${total})\n\n${lines.join("\n")}${more}`;
    } catch (err) {
      return `*Could not read folder: ${String(err)}*`;
    }
  }

  if (isImage(item.name)) {
    const encoded = item.path.split("/").map(encodeURIComponent).join("/");
    // raycast-width constrains by width so the image fits the detail pane
    // without being upscaled/cropped (which is what raycast-height does).
    return `\n\n![${item.name}](file://${encoded}?raycast-width=350)\n`;
  }

  if (isText(item.name) && item.size <= 1_000_000) {
    try {
      const content = await readTextPreview(item.path);
      const lang = languageFor(item.name);
      const truncated = content.length >= 16_384 ? "\n\n*…truncated*" : "";
      return "```" + lang + "\n" + content + "\n```" + truncated;
    } catch (err) {
      return `*Could not read file: ${String(err)}*`;
    }
  }

  return "";
}
