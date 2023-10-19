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

export type VersionArray = [number, number, number];

export type FirmwareRelease = {
    required: boolean;
    url: string;
    fingerprint: string;
    changelog: string;
    min_bridge_version: VersionArray;
    version: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    bootloader_version?: VersionArray;
    url_bitcoinonly?: string;
    fingerprint_bitcoinonly?: string;
    notes?: string;
    channel?: string;
};

export type IntermediaryVersion = 1 | 2 | 3;

export type ReleaseInfo = {
    changelog: FirmwareRelease[] | null;
    release: FirmwareRelease;
    isRequired: boolean | null;
    isNewer: boolean | null;
    /**
     * v1 - bootloader < 1.8.0
     * v2 - bootloader >= 1.8.0, < 1.12.0
     * v3 - bootloader >= 1.12.0
     */
    intermediaryVersion?: IntermediaryVersion;
};
