export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export interface Release {
    bootloader_version: number[];
    firmwareVersion: number[];
    version: number[];
    rollout: number;
    required: boolean;
    min_firmware_version: number[];
    min_bootloader_version: number[];
}

export interface Input {
    firmwareVersion: number;
    isInBootloader: boolean;
    firmwarePresent: boolean;
    releasesList: Release[];
}
