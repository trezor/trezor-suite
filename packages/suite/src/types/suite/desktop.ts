export type UpdateInfo = {
    version: string;
    releaseDate: string;
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
};

export type UpdateWindow = 'maximized' | 'minimized' | 'hidden';
