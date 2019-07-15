export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export interface Release {
    required: boolean;
    version: number[];
    bootloader_version?: number[];
    min_bridge_version: number[];
    min_firmware_version: number[];
    min_bootloader_version: number[];
    url: string;
    fingerprint: string;
    changelog: string;
    rollout?: number;
}

export interface RolloutOpts {
    releasesListsPaths: {
        1: string;
        2: string;
    };
    baseUrl: string;
}

export type Firmware = ArrayBuffer;

// TODO: take Features from connect;
export type Features = any;
