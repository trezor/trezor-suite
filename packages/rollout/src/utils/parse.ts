import { Boolean, Number, String, Literal, Tuple, Record, Union, Partial, Static } from 'runtypes';

/**
 * Partial types from trezor-connect, argument of `getInfo` method
 * @param extFeatures
 */
export interface Features {
    bootloader_mode?: boolean | null;
    device_id: string | null;
    firmware_present?: boolean | null;
    fw_major?: number | null;
    fw_minor?: number | null;
    fw_patch?: number | null;
    major_version: number;
    minor_version: number;
    patch_version: number;
}

/**
 * Accepts external features (from trezor-connect), checks whether it comes in expected
 * shape and narrows its type to stricter one.
 * @param extFeatures
 */

export interface StrictFeatures<
    MV extends Features['major_version'],
    BL extends Features['bootloader_mode'],
    FW extends Features['firmware_present'],
    FW_MV extends Features['fw_major'] = null
> extends Features {
    major_version: MV;
    fw_major: FW_MV;
    fw_minor: FW_MV extends number ? number : null;
    fw_patch: FW_MV extends number ? number : null;
    bootloader_mode: BL;
    firmware_present: FW;
}

export const parseFeatures = (extFeatures: Features) => {
    if (extFeatures.major_version === 2 && extFeatures.firmware_present === false) {
        return extFeatures as StrictFeatures<2, true, false>;
    }
    if (extFeatures.major_version === 2 && extFeatures.bootloader_mode == null) {
        return extFeatures as StrictFeatures<2, null, null>;
    }
    if (extFeatures.major_version === 2 && extFeatures.bootloader_mode === true) {
        return extFeatures as StrictFeatures<2, true, true, 2>;
    }
    if (extFeatures.major_version === 1 && extFeatures.firmware_present === false) {
        return extFeatures as StrictFeatures<1, true, false>;
    }
    if (extFeatures.major_version === 1 && extFeatures.bootloader_mode === null) {
        return extFeatures as StrictFeatures<1, true, false>;
    }
    if (extFeatures.major_version === 1 && extFeatures.bootloader_mode === true) {
        return extFeatures as StrictFeatures<1, true, true>;
    }
    throw new Error('Features of unexpected shape provided to rollout');
};

/**
 * runtime type checking declarations
 */

const VersionArrayT2 = Tuple(Literal(2), Number, Number);
const VersionArrayT1 = Tuple(Literal(1), Number, Number);

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
export type VersionArray = VersionArrayT1 | VersionArrayT2;

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
