import type { Features } from '@trezor/connect-common';
import { firmwareAssets } from '@trezor/connect-data';
import type { FirmwareRelease, IntermediaryReleaseConfig } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import type { selectFirmwareRelease } from './firmwareInfo';

type SelectFirmwareReleaseFixture = {
    desc: string;
    features: Features;
    release: FirmwareRelease;
    releasesOfDevice: FirmwareRelease[];
    intermediaries: IntermediaryReleaseConfig[];
} & (
    | { result: ReturnType<typeof selectFirmwareRelease>; error?: never }
    | { result?: never; error: string }
);

// Firmware releases below are copies of packages/connect-data/files/firmware/<model>/universal/<release>.json,
// except the unneeded fields were omitted.

const mockFirmwareRelease = (release: Partial<FirmwareRelease>) => release as FirmwareRelease;

const t1b1_1_6_1 = mockFirmwareRelease({
    required: true,
    version: [1, 6, 1],
    min_firmware_version: [1, 0, 0],
    min_bootloader_version: [1, 0, 0],
    bootloader_version: [1, 4, 0],
});

const t1b1_1_11_2 = mockFirmwareRelease({
    required: false,
    version: [1, 11, 2],
    min_firmware_version: [1, 6, 2],
    min_bootloader_version: [1, 5, 0],
    bootloader_version: [1, 11, 0],
});

const t1b1_1_12_1 = mockFirmwareRelease({
    required: true,
    version: [1, 12, 1],
    min_firmware_version: [1, 12, 0],
    min_bootloader_version: [1, 12, 0],
    bootloader_version: [1, 12, 1],
});

const t1b1_1_13_1 = mockFirmwareRelease({
    required: false,
    version: [1, 13, 1],
    min_firmware_version: [1, 12, 0],
    min_bootloader_version: [1, 12, 0],
    bootloader_version: [1, 12, 1],
});

const t1b1_1_14_0 = mockFirmwareRelease({
    required: false,
    version: [1, 14, 0],
    min_firmware_version: [1, 12, 0],
    min_bootloader_version: [1, 12, 0],
    bootloader_version: [1, 12, 1],
});

const t2t1_2_0_7 = mockFirmwareRelease({
    required: false,
    version: [2, 0, 7],
    min_firmware_version: [2, 0, 5],
    min_bootloader_version: [2, 0, 0],
    bootloader_version: [2, 0, 0],
});

const t2t1_2_0_9 = mockFirmwareRelease({
    required: false,
    version: [2, 0, 9],
    min_firmware_version: [2, 0, 5],
    min_bootloader_version: [2, 0, 0],
    bootloader_version: [2, 0, 0],
});

const t2t1_2_1_0 = mockFirmwareRelease({
    required: true,
    version: [2, 1, 0],
    min_firmware_version: [2, 0, 5],
    min_bootloader_version: [2, 0, 0],
    bootloader_version: [2, 0, 3],
});

// One of the releases that does not declare `bootloader_version`.
const t2t1_2_1_1 = mockFirmwareRelease({
    required: false,
    version: [2, 1, 1],
    min_firmware_version: [2, 0, 5],
    min_bootloader_version: [2, 0, 0],
});

const t2t1_2_1_4 = mockFirmwareRelease({
    required: false,
    version: [2, 1, 4],
    min_firmware_version: [2, 0, 8],
    min_bootloader_version: [2, 0, 0],
});

const t2t1_2_12_0 = mockFirmwareRelease({
    required: false,
    version: [2, 12, 0],
    min_firmware_version: [2, 0, 8],
    min_bootloader_version: [2, 0, 0],
    bootloader_version: [2, 1, 16],
});

const releasesT1B1 = [t1b1_1_14_0, t1b1_1_12_1, t1b1_1_11_2, t1b1_1_6_1];
const releasesT2T1 = [t2t1_2_12_0, t2t1_2_1_1, t2t1_2_1_0, t2t1_2_0_9, t2t1_2_0_7];

// Intermediaries of packages/connect-data/files/firmware/release/releases.v1.json, defined for T1B1 only.
const intermediaryV1: IntermediaryReleaseConfig = {
    min_firmware_version: [1, 6, 2],
    min_bootloader_version: [1, 8, 0],
    version: 1,
};

const intermediaryV2: IntermediaryReleaseConfig = {
    min_firmware_version: [1, 12, 0],
    min_bootloader_version: [1, 12, 0],
    version: 2,
};

const intermediaryV3: IntermediaryReleaseConfig = {
    min_firmware_version: [1, 12, 1],
    min_bootloader_version: [1, 12, 1],
    version: 3,
};

const intermediariesT1B1 = [intermediaryV1, intermediaryV2, intermediaryV3];

const mockFeatures = (
    mode: 'normal' | 'bootloader',
    major_version: 1 | 2,
    minor_version: number,
    patch_version: number,
    firmware_present?: boolean,
) =>
    ({
        device_id: 'device-id',
        internal_model: major_version === 1 ? DeviceModelInternal.T1B1 : DeviceModelInternal.T2T1,
        bootloader_mode: mode === 'bootloader' ? true : null,
        firmware_present: mode === 'normal' || !!firmware_present,
        major_version,
        minor_version,
        patch_version,
    }) as Features;

export const selectFirmwareReleaseFixtures: SelectFirmwareReleaseFixture[] = [
    {
        desc: 'firmware mode: latest release is already installed',
        features: mockFeatures('normal', 2, 12, 0),
        release: t2t1_2_12_0,
        releasesOfDevice: releasesT2T1,
        intermediaries: [],
        result: {
            release: t2t1_2_12_0,
            intermediary: undefined,
            isNewer: false,
            isRequired: false,
        },
    },
    {
        desc: 'firmware mode: latest release is supported and required',
        features: mockFeatures('normal', 2, 0, 9),
        release: t2t1_2_12_0,
        releasesOfDevice: releasesT2T1,
        intermediaries: [],
        result: {
            release: t2t1_2_12_0,
            intermediary: undefined,
            isNewer: true,
            isRequired: true,
        },
    },
    {
        desc: 'firmware mode: latest release is unsupported (min_firmware_version), first intermediary is offered',
        features: mockFeatures('normal', 1, 6, 1),
        release: t1b1_1_14_0,
        releasesOfDevice: releasesT1B1,
        intermediaries: intermediariesT1B1,
        result: {
            release: t1b1_1_14_0,
            intermediary: intermediaryV1,
            isNewer: true,
            isRequired: true,
        },
    },
    {
        desc: 'firmware mode: latest release is unsupported (min_firmware_version), no matching intermediary, newest compatible is offered',
        features: mockFeatures('normal', 2, 0, 7),
        release: t2t1_2_12_0,
        releasesOfDevice: releasesT2T1,
        intermediaries: [],
        result: {
            release: t2t1_2_1_1,
            intermediary: undefined,
            isNewer: true,
            isRequired: true,
        },
    },
    {
        desc: 'firmware mode: latest release is unsupported (min_firmware_version), no matching intermediary, no compatible, latest is offered anyway',
        features: mockFeatures('normal', 2, 0, 7),
        release: t2t1_2_12_0,
        releasesOfDevice: [t2t1_2_12_0, t2t1_2_1_4],
        intermediaries: [],
        result: {
            release: t2t1_2_12_0,
            intermediary: undefined,
            isNewer: true,
            isRequired: false,
        },
    },

    {
        desc: 'bootloader mode: latest release is supported, its bootloader is not newer than the installed one',
        features: mockFeatures('bootloader', 1, 12, 1),
        release: t1b1_1_14_0,
        releasesOfDevice: releasesT1B1,
        intermediaries: intermediariesT1B1,
        result: {
            release: t1b1_1_14_0,
            intermediary: undefined,
            isNewer: false,
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode: reported firmware version is used instead of the bootloader version',
        features: {
            ...mockFeatures('bootloader', 2, 0, 0, true),
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 9,
        },
        release: t2t1_2_12_0,
        releasesOfDevice: releasesT2T1,
        intermediaries: [],
        result: {
            release: t2t1_2_12_0,
            intermediary: undefined,
            isNewer: true,
            // The bootloader branch would return false here, because firmware is present.
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode: latest release is unsupported (min_bootloader_version), second intermediary is offered',
        features: mockFeatures('bootloader', 1, 11, 0),
        release: t1b1_1_14_0,
        releasesOfDevice: releasesT1B1,
        intermediaries: intermediariesT1B1,
        result: {
            release: t1b1_1_14_0,
            intermediary: intermediaryV2,
            isNewer: true,
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode: latest release is unsupported (min_bootloader_version), no matching intermediary, newest compatible is offered',
        features: mockFeatures('bootloader', 1, 10, 0, true),
        release: t1b1_1_14_0,
        releasesOfDevice: releasesT1B1,
        // The config listed the first intermediary only, until 1.12.0 introduced the second one.
        intermediaries: [intermediaryV1],
        result: {
            release: t1b1_1_11_2,
            intermediary: undefined,
            isNewer: true,
            isRequired: false,
        },
    },
    {
        desc: 'bootloader mode: latest release is unsupported (min_bootloader_version), no matching intermediary, no compatible, latest is offered anyway',
        features: mockFeatures('bootloader', 1, 10, 0),
        release: t1b1_1_14_0,
        releasesOfDevice: [t1b1_1_14_0, t1b1_1_13_1],
        intermediaries: [intermediaryV1],
        result: {
            release: t1b1_1_14_0,
            intermediary: undefined,
            isNewer: true,
            isRequired: false,
        },
    },
    {
        desc: 'bootloader mode: latest release is supported, its bootloader is newer than the installed one',
        features: mockFeatures('bootloader', 2, 0, 3),
        release: t2t1_2_12_0,
        releasesOfDevice: releasesT2T1,
        intermediaries: [],
        result: {
            release: t2t1_2_12_0,
            intermediary: undefined,
            isNewer: true,
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode: latest release is supported, but does not define a bootloader version',
        features: mockFeatures('bootloader', 2, 0, 0),
        release: t2t1_2_1_1,
        releasesOfDevice: [t2t1_2_1_1, t2t1_2_1_0, t2t1_2_0_9, t2t1_2_0_7],
        intermediaries: [],
        result: {
            release: t2t1_2_1_1,
            intermediary: undefined,
            isNewer: false,
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode: device reports neither a firmware nor a bootloader version',
        features: {
            ...mockFeatures('bootloader', 1, 0, 0),
            // A zeroed major version is the only way features can report neither version.
            major_version: 0,
        },
        release: t1b1_1_14_0,
        releasesOfDevice: releasesT1B1,
        intermediaries: intermediariesT1B1,
        error: 'Firmware version is not version array.',
    },
];

const latestT1FirmwareVersion = Object.values(firmwareAssets.t1b1?.universal ?? {}).sort((a, b) =>
    versionUtils.isNewer(b.version, a.version) ? 1 : -1,
)?.[0]?.version;

export const getFirmwareReleaseConfigInfoFixture = [
    {
        desc: 'should offer latest compatible relase when latest one is not compatible',
        features: mockFeatures('normal', 2, 0, 7),
        result: { release: { version: [2, 1, 1] }, intermediary: undefined },
    },
    {
        desc: 'should offer lastest release and intermediary v2 for T1B1 <  1.12.0',
        features: mockFeatures('normal', 1, 11, 2),
        result: {
            release: { version: latestT1FirmwareVersion },
            intermediary: { version: 2 },
        },
    },
];

const deviceId = '36647600C9CEB95187D31BC5'; // bucket 24 when [0, 100), BUT bucket 100 when [0, 100]
const deviceBucket = 24;

export const calculateShouldOfferReleaseFixture = [
    {
        desc: 'does not offer a release at 0% rollout',
        rollout_probability: 0,
        deviceId,
        result: false,
    },
    {
        desc: 'offers a release at 100% rollout to a device in the formerly excluded bucket',
        rollout_probability: 100,
        deviceId,
        result: true,
    },
    {
        desc: 'does not offer a release when the device bucket equals the rollout threshold',
        rollout_probability: deviceBucket,
        deviceId,
        result: false,
    },
    {
        desc: 'offers a release when the device bucket is below the rollout threshold',
        rollout_probability: deviceBucket + 1,
        deviceId,
        result: true,
    },
    {
        desc: 'does not offer a release without a device id at 0% rollout',
        rollout_probability: 0,
        deviceId: null,
        result: false,
    },
    {
        desc: 'offers a release without a device id at a positive rollout',
        rollout_probability: 1,
        deviceId: null,
        result: true,
    },
    {
        desc: 'rejects an out-of-range rollout probability of -1',
        rollout_probability: -1,
        deviceId,
        error: 'Probability must be between 0 and 100.',
    },
    {
        desc: 'rejects an out-of-range rollout probability of 101',
        rollout_probability: 101,
        deviceId,
        error: 'Probability must be between 0 and 100.',
    },
];
