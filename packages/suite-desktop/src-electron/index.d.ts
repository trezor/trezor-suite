// Include suite globals (as some dependencies from @suite can rely on them)
/// <reference path="../../suite/global.d.ts" />

// Globals
declare namespace NodeJS {
    export interface Global {
        logger: ILogger;
        resourcesPath: string;
    }
}

declare interface ILogger {
    /**
     * Exit the Logger (will correctly end the log file)
     */
    exit();
    /**
     * Error message (level: 1)
     * @param topic(string) - Log topic
     * @param message(string | string[]) - Message content(s)
     */
    error(topic: string, message: string | string[]);
    /**
     * Warning message (level: 2)
     * @param topic(string) - Log topic
     * @param message(string | string[]) - Message content(s)
     */
    warn(topic: string, message: string | string[]);
    /**
     * Info message (level: 3)
     * @param topic(string) - Log topic
     * @param message(string | string[]) - Message content(s)
     */
    info(topic: string, message: string | string[]);
    /**
     * Debug message (level: 4)
     * @param topic(string) - Log topic
     * @param message(string | string[]) - Message content(s)
     */
    debug(topic: string, message: string | string[]);
    /**
     * Log Level getter
     */
    level: LogLevel;
}

// Dependencies
declare type Dependencies = {
    mainWindow: Electron.BrowserWindow;
    store: LocalStore;
    src: string;
};

// Store
declare interface LocalStore {
    getWinBounds(): WinBounds;
    setWinBounds(winBound: WinBounds): void;
    getUpdateSettings(): UpdateSettings;
    setUpdateSettings(updateSettings: UpdateSettings): void;
    getTorSettings(): TorSettings;
    setTorSettings(torSettings: TorSettings): void;
    clear(): void;
}

declare type WinBounds = {
    height: number;
    width: number;
};

declare type UpdateSettings = {
    skipVersion: string;
};

declare type TorSettings = {
    /**
     * True when tor should be enabled.
     * Doesn't necessarily mean that the bundled tor is running
     * as that depends on the address as well.
     */
    running: boolean;
    /**
     * Address of the tor process through which traffic is routed.
     * If it's anything other than the default one assume user
     * wants to use their own tor instance and don't run the bundled one.
     */
    address: string;
};
