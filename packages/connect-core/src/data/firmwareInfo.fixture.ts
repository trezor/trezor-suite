import type { Features } from '@trezor/connect-common';
import type { FirmwareRelease, IntermediaryReleaseConfig } from '@trezor/device-utils';

import type { selectFirmwareRelease } from './firmwareInfo';

const { getDeviceFeatures } = global.JestMocks;

type SelectFirmwareReleaseFixture = {
    desc: string;
    features: Features;
    release: FirmwareRelease;
    releasesOfDevice: FirmwareRelease[];
    intermediaries: IntermediaryReleaseConfig[];
    result: ReturnType<typeof selectFirmwareRelease>;
};

type SelectFirmwareReleaseErrorFixture = Omit<SelectFirmwareReleaseFixture, 'result'> & {
    error: string;
};

const latest: FirmwareRelease = {
    version: [2, 5, 0],
    bootloader_version: [1, 5, 0],
    min_firmware_version: [2, 2, 0],
    min_bootloader_version: [1, 2, 0],
    required: false,
    url: 'firmware/latest.bin',
    fingerprint: '',
    translations: {},
};

const compatible: FirmwareRelease = {
    ...latest,
    version: [2, 3, 0],
    bootloader_version: [1, 3, 0],
    min_firmware_version: [2, 0, 0],
    min_bootloader_version: [1, 0, 0],
};

const older: FirmwareRelease = {
    ...compatible,
    version: [2, 1, 0],
    bootloader_version: [1, 1, 0],
};

const satisfiedIntermediary: IntermediaryReleaseConfig = {
    version: 1,
    min_firmware_version: [2, 1, 0],
    min_bootloader_version: [1, 1, 0],
};

const nextIntermediary: IntermediaryReleaseConfig = {
    version: 2,
    min_firmware_version: [2, 2, 0],
    min_bootloader_version: [1, 2, 0],
};

const laterIntermediary: IntermediaryReleaseConfig = {
    version: 3,
    min_firmware_version: [2, 4, 0],
    min_bootloader_version: [1, 4, 0],
};

const firmwareFeatures = getDeviceFeatures({
    major_version: 2,
    minor_version: 1,
    patch_version: 0,
    firmware_present: true,
});

const bootloaderFeatures = getDeviceFeatures({
    bootloader_mode: true,
    major_version: 1,
    minor_version: 1,
    patch_version: 0,
    firmware_present: false,
});

const releaseWithoutBootloader: FirmwareRelease = { ...latest, bootloader_version: undefined };

export const selectFirmwareReleaseFixtures: SelectFirmwareReleaseFixture[] = [
    {
        desc: 'accepts the minimum firmware version and detects a required update other than latest',
        features: { ...firmwareFeatures, minor_version: 2 },
        release: latest,
        releasesOfDevice: [latest, { ...compatible, required: true }],
        intermediaries: [laterIntermediary],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: true },
    },
    {
        desc: 'uses reported firmware in bootloader mode and ignores required releases at or below it',
        features: {
            ...bootloaderFeatures,
            firmware_present: true,
            fw_major: 2,
            fw_minor: 5,
            fw_patch: 0,
        },
        release: latest,
        releasesOfDevice: [
            { ...latest, required: true },
            { ...older, required: true },
        ],
        intermediaries: [nextIntermediary],
        result: { release: latest, intermediary: undefined, isNewer: false, isRequired: false },
    },
    {
        desc: 'does not mark an older firmware release as newer or required',
        features: { ...firmwareFeatures, minor_version: 6 },
        release: latest,
        releasesOfDevice: [{ ...latest, required: true }],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: false, isRequired: false },
    },
    {
        desc: 'skips satisfied intermediaries and selects the first unmet firmware minimum before a compatible release',
        features: firmwareFeatures,
        release: latest,
        releasesOfDevice: [compatible, latest],
        intermediaries: [satisfiedIntermediary, nextIntermediary, laterIntermediary],
        result: {
            release: latest,
            intermediary: nextIntermediary,
            isNewer: true,
            isRequired: false,
        },
    },
    {
        desc: 'selects the newest firmware-compatible release from unordered candidates when no intermediary matches',
        features: firmwareFeatures,
        release: latest,
        releasesOfDevice: [older, latest, compatible],
        intermediaries: [satisfiedIntermediary],
        result: { release: compatible, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'retains latest when neither an intermediary nor a firmware-compatible release exists',
        features: firmwareFeatures,
        release: latest,
        releasesOfDevice: [latest],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'retains latest without requiring an update when the firmware release list is empty',
        features: firmwareFeatures,
        release: latest,
        releasesOfDevice: [],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'accepts the minimum bootloader version and does not require an optional fresh installation',
        features: { ...bootloaderFeatures, minor_version: 2 },
        release: latest,
        releasesOfDevice: [latest],
        intermediaries: [laterIntermediary],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'does not mark an equal bootloader as newer or require an update when firmware is present',
        features: { ...bootloaderFeatures, minor_version: 5, firmware_present: true },
        release: latest,
        releasesOfDevice: [{ ...latest, required: true }],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: false, isRequired: false },
    },
    {
        desc: 'does not mark an older bootloader as newer but requires a mandatory fresh installation',
        features: { ...bootloaderFeatures, minor_version: 6 },
        release: latest,
        releasesOfDevice: [latest, { ...older, required: true }],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: false, isRequired: true },
    },
    {
        desc: 'does not mark a release without a bootloader version as newer',
        features: { ...bootloaderFeatures, minor_version: 2 },
        release: releaseWithoutBootloader,
        releasesOfDevice: [releaseWithoutBootloader],
        intermediaries: [],
        result: {
            release: releaseWithoutBootloader,
            intermediary: undefined,
            isNewer: false,
            isRequired: false,
        },
    },
    {
        desc: 'selects the first unmet bootloader minimum before a compatible release and marks an intermediary as newer without a release bootloader version',
        features: bootloaderFeatures,
        release: releaseWithoutBootloader,
        releasesOfDevice: [compatible, releaseWithoutBootloader],
        intermediaries: [satisfiedIntermediary, nextIntermediary, laterIntermediary],
        result: {
            release: releaseWithoutBootloader,
            intermediary: nextIntermediary,
            isNewer: true,
            isRequired: false,
        },
    },
    {
        desc: 'selects the newest bootloader-compatible release from unordered candidates when no intermediary matches',
        features: bootloaderFeatures,
        release: latest,
        releasesOfDevice: [older, latest, compatible],
        intermediaries: [satisfiedIntermediary],
        result: { release: compatible, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'retains latest when neither an intermediary nor a bootloader-compatible release exists',
        features: bootloaderFeatures,
        release: latest,
        releasesOfDevice: [latest],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: false },
    },
    {
        desc: 'retains latest without requiring an installation when the bootloader release list is empty',
        features: bootloaderFeatures,
        release: latest,
        releasesOfDevice: [],
        intermediaries: [],
        result: { release: latest, intermediary: undefined, isNewer: true, isRequired: false },
    },
];

export const selectFirmwareReleaseErrorFixtures: SelectFirmwareReleaseErrorFixture[] = [
    {
        desc: 'firmware mode with an invalid firmware version',
        features: getDeviceFeatures({ major_version: -1 }),
        release: latest,
        releasesOfDevice: [],
        intermediaries: [],
        error: 'Firmware version is not version array.',
    },
    {
        desc: 'bootloader mode without a firmware or valid bootloader version',
        features: getDeviceFeatures({ bootloader_mode: true, major_version: 0 }),
        release: latest,
        releasesOfDevice: [],
        intermediaries: [],
        error: 'Firmware version is not version array.',
    },
];
