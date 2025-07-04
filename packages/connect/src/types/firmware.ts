import type {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareType,
    IntermediaryReleaseConfig,
    VersionArray,
} from '@trezor/device-utils';

export type FirmwareRange = Record<
    DeviceModelInternal,
    {
        min: string;
        max: string;
    }
>;

export type BinaryInfo = {
    binary: ArrayBuffer;
    binaryVersion: VersionArray;
    releaseVersion?: VersionArray;
};

export type FirmwareReleaseConfigInfo = {
    firmwareType: FirmwareType;
    isBitcoinOnlyAvailable: boolean;
    releaseConditions: ConditionalRelease['conditions'] & { shouldBeOffered: boolean };
    release: ConditionalRelease['release'];
    intermediary: IntermediaryReleaseConfig | undefined;
    isRequired: boolean | null;
    isNewer: boolean | null;
    translations?: string[];
};
