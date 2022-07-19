export interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    authFilePath: string;
}

export type BootstrapEvent = {
    progress: string | undefined;
    summary: string | undefined;
};
