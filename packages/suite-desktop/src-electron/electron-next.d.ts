declare module 'electron-next' {
    function adjustRenderer(directory: string): void;

    function devServer(dir: string, port?: number): void;

    interface Directories {
        production: string;
        development: string;
    }

    export default function (
        directories: Directories | string,
        port?: number,
    ): adjustRenderer | devServer;
}

declare type UpdateSettings = {
    skipVersion: string;
};

declare type TorSettings = {
    running: boolean;
    address: string;
};
