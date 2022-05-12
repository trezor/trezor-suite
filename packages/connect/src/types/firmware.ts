export interface FirmwareRange {
    '1': {
        min: string;
        max: string;
    };
    '2': {
        min: string;
        max: string;
    };
}

export type VersionArray = [1 | 2, number, number];

export type FirmwareRelease = {
    required: boolean;
    url: string;
    fingerprint: string;
    changelog: string;
    min_bridge_version: [number, number, number];
    version: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    bootloader_version?: VersionArray;
    url_bitcoinonly?: string;
    fingerprint_bitcoinonly?: string;
    notes?: string;
    rollout?: number;
    channel?: string;
};

export type ReleaseInfo = {
    changelog: FirmwareRelease[] | null;
    release: FirmwareRelease;
    isLatest: boolean;
    latest: FirmwareRelease;
    isRequired: boolean | null;
    isNewer: boolean | null;
};
