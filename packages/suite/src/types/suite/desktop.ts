export type UpdateInfo = {
    version: string;
    releaseDate: string;
    isManualCheck?: boolean;
    downloadedFile?: string;
};

export type UpdateError = {
    error: Error;
};

export type UpdateProgress = {
    total: number;
    delta: number;
    transferred: number;
    percent: number;
    bytesPerSecond: number;
    verifying: boolean;
};

export type UpdateWindow = 'maximized' | 'minimized' | 'hidden';
