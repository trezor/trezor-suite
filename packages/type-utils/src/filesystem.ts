import type { RmOptions } from 'fs';

export type CopyFile = (source: string, destination: string, mode?: number) => Promise<void>;

export type CopyFileDep = { copyFile: CopyFile };

export type Mkdir = (path: string, options: { recursive: true }) => Promise<string | undefined>;

export type MkdirDep = { mkdir: Mkdir };

export type ReadDirectory = (directory: string) => Promise<string[]>;

export type ReadDirectoryDep = { readDirectory: ReadDirectory };

export type ReadFile = (path: string) => Promise<Buffer>;

export type ReadFileDep = { readFile: ReadFile };

export type Rm = (path: string, options?: RmOptions) => Promise<void>;

export type RmDep = { rm: Rm };

export type WriteFile = (path: string, data: Buffer) => Promise<void>;

export type WriteFileDep = { writeFile: WriteFile };
