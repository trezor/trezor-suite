export interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    torDataDir: string;
}

export type BootstrapEvent = {
    progress: string | undefined;
    summary: string | undefined;
};

export interface InterceptedEvent {
    method: string;
    details: string;
}
