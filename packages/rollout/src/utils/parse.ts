import { Features } from 'trezor-connect';

import {
    Boolean,
    Number,
    String,
    Literal,
    Tuple,
    Record,
    Union,
    Undefined,
    Partial,
    Static,
} from 'runtypes';

const VersionArrayT2 = Tuple(Literal(2), Number, Number);
const VersionArrayT1 = Tuple(Literal(1), Number, Number);

/**
 * Models: 1, 2
 * No firmware installed
 */
interface FeaturesShape1<Major> extends Omit<Features, 'major_version'> {
    major_version: Major;
    minor_version: number;
    patch_version: number;
    fw_major: null;
    fw_minor: null;
    fw_patch: null;
    bootloader_mode: true;
    firmware_present: false;
}

/**
 * Models: 1, 2
 * Firmware installed
 * Not in bootloader mode
 */
interface FeaturesShape2<Major> extends Omit<Features, 'major_version'> {
    major_version: Major;
    minor_version: number;
    patch_version: number;
    fw_major: null;
    fw_minor: null;
    fw_patch: null;
    bootloader_mode: null;
    firmware_present: null;
}

/**
 * Models: 2
 * Firmware installed
 * Bootloader mode
 */
interface FeaturesShape3 extends Features {
    major_version: 2;
    minor_version: number;
    patch_version: number;
    fw_major: 2;
    fw_minor: number;
    fw_patch: number;
    bootloader_mode: true;
    firmware_present: true;
}

/**
 * Models: 1
 * Firmware installed
 * bootloader mode
 */
interface FeaturesShape4 extends Features {
    major_version: 1;
    minor_version: number;
    patch_version: number;
    fw_major: null;
    fw_minor: null;
    fw_patch: null;
    bootloader_mode: true;
    firmware_present: true;
}

/**
 * Accepts external features (from trezor-connect), checks wheter it comes in expected
 * shape and narrows its type to stricter one.
 * @param extFeatures
 */

export const parseFeatures = (extFeatures: Features) => {
    if (extFeatures.major_version === 2 && extFeatures.firmware_present === false) {
        return extFeatures as FeaturesShape1<2>;
    }
    if (extFeatures.major_version === 2 && extFeatures.bootloader_mode == null) {
        return extFeatures as FeaturesShape2<2>;
    }
    if (extFeatures.major_version === 2 && extFeatures.bootloader_mode === true) {
        return extFeatures as FeaturesShape3;
    }
    if (extFeatures.major_version === 1 && extFeatures.firmware_present === false) {
        return extFeatures as FeaturesShape1<1>;
    }
    if (extFeatures.major_version === 1 && extFeatures.bootloader_mode === null) {
        return extFeatures as FeaturesShape1<1>;
    }
    if (extFeatures.major_version === 1 && extFeatures.bootloader_mode === true) {
        return extFeatures as FeaturesShape4;
    }
    throw new Error('Features of unexpected shape provided to rollout');
};

const Release = Record({
    required: Boolean,
    url: String,
    fingerprint: String,
    changelog: String,
    min_bridge_version: Tuple(Number, Number, Number),
    version: Union(VersionArrayT1, VersionArrayT2),
    min_firmware_version: Union(VersionArrayT1, VersionArrayT2),
    min_bootloader_version: Union(VersionArrayT1, VersionArrayT2),
}).And(
    Partial({
        bootloader_version: Union(VersionArrayT1, VersionArrayT2),
        url_bitcoinonly: String,
        fingerprint_bitcoinonly: String,
        notes: String,
        rollout: Number,
        channel: String,
    })
);

export type Release = Static<typeof Release>;
export type VersionArrayT1 = Static<typeof VersionArrayT1>;
export type VersionArrayT2 = Static<typeof VersionArrayT2>;

/**
 * Accepts external releases as published here:
 * https://github.com/trezor/webwallet-data/blob/master/firmware/2/releases.json
 * https://github.com/trezor/webwallet-data/blob/master/firmware/1/releases.json
 * and narrows them down into (somewhat more) strongly typed releases.
 * Once we have trezor-connect in monorepo and ts we might remove this, but Id rather
 * be more defensive now.
 */
export const parseReleases = (extReleases: any): Release[] => {
    try {
        extReleases.forEach(e => {
            Release.check(e);
        });
        return extReleases;
    } catch (err) {
        throw new Error(`Release object in unexpected shape: ${err}`);
    }
};
