export type Mkdir = (path: string, options: { recursive: true }) => Promise<string | undefined>;

export type MkdirDep = { mkdir: Mkdir };
