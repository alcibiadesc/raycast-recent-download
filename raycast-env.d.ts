/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Folder 1 - Select an additional folder to display recently downloaded files. (Default: Downloads folder) */
  "folder1": string,
  /** Folder 2 - Select an additional folder to display recently downloaded files. */
  "folder2"?: string,
  /** Folder 3 - Select an additional folder to display recently downloaded files. */
  "folder3"?: string,
  /** Folder 4 - Select an additional folder to display recently downloaded files. */
  "folder4"?: string,
  /** Folder 5 - Select an additional folder to display recently downloaded files. */
  "folder5"?: string,
  /** Folders - Show folders alongside files (allows deleting folders too). */
  "includeFolders": boolean,
  /** Folder Size - Calculate total size of each folder (slower for large folders). */
  "computeFolderSize": boolean,
  /** Max Items - Maximum number of items to display (for performance). */
  "maxItems": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
}

