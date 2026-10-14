export type WriteFile = (path: string, data: Buffer) => Promise<void>;

export type WriteFileDep = { writeFile: WriteFile };
