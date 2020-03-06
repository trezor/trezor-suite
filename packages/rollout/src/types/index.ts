import { Features } from 'trezor-connect';
import { parseFeatures, parseReleases, VersionArrayT1, VersionArrayT2 } from '../utils/parse';

export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export type VersionArray = VersionArrayT1 | VersionArrayT2;

export type ReleaseList = ReturnType<typeof parseReleases>;
export type Release = ReleaseList[number];

export type Firmware = ArrayBuffer;

export type ParsedFeatures = ReturnType<typeof parseFeatures>;
export type OriginalFeatures = Features;
