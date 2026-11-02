/** @serviceContract */
export type CliCommand = {
    name: string;
    exec: (args: readonly string[]) => Promise<void>;
};
