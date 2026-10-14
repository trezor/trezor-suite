export type ReadFile = (path: string) => Promise<Buffer>;

export type ReadFileDep = { readFile: ReadFile };
