// Globals
declare namespace NodeJS {
    export interface Global {
        quitOnWindowClose: boolean;
    }
}

// Store
declare interface LocalStore {
    getWinBounds(): WinBounds;
    setWinBounds(winBound: WinBounds): void;
    getUpdateSettings(): UpdateSettings;
    setUpdateSettings(updateSettings: UpdateSettings): void;
    getTorSettings(): TorSettings;
    setTorSettings(torSettings: TorSettings): void;
}

declare type WinBounds = {
    height: number;
    width: number;
};

declare type UpdateSettings = {
    skipVersion: string;
};

declare type TorSettings = {
    running: boolean;
    address: string;
};
