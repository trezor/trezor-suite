export type Mkdir = (path: string, options: { recursive: true }) => Promise<string | undefined>;

export type MkdirDep = { mkdir: Mkdir };

export type ReadFile = (path: string) => Promise<Buffer>;

export type ReadFileDep = { readFile: ReadFile };

export type WriteFile = (path: string, data: Buffer) => Promise<void>;

export type WriteFileDep = { writeFile: WriteFile };
