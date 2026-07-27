import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { type VersionArray, versionUtils } from '@trezor/utils';

import type { Requirement } from '../Requirement';

const FIRMWARE_DIR = join('packages', 'connect-data', 'files', 'firmware');

// `release/` holds the aggregated release config (releases.v1.json), not per-version firmware files.
const NON_MODEL_DIRS = new Set(['release']);

// Semver-array fields whose value is a floor that must never regress across firmware versions of
// the same model and channel. A newer firmware may only raise (or keep) these minimums, never
// lower them, otherwise a device could be offered an update that silently relaxes a previously
// stated requirement.
const MONOTONIC_FIELDS = [
    'min_firmware_version',
    'min_bootloader_version',
    'bootloader_version',
] as const;

type MonotonicField = (typeof MONOTONIC_FIELDS)[number];

type FirmwareReleaseFile = {
    readonly version: VersionArray;
} & Partial<Record<MonotonicField, VersionArray>>;

type FirmwareRelease = {
    readonly file: string;
    readonly data: FirmwareReleaseFile;
};

type HighestFloor = {
    readonly value: VersionArray;
    readonly version: VersionArray;
};

const formatVersion = (version: VersionArray): string => version.join('.');

// Reports the path relative to the scanned firmware directory with normalized separators, so the
// message is stable across machines and OSes (the raw absolute path leaks the runner's layout).
const toReportedPath = (firmwareDir: string, file: string): string =>
    relative(firmwareDir, file).split(sep).join('/');

const readChannelReleases = (channelDir: string): FirmwareRelease[] => {
    const releases: FirmwareRelease[] = [];

    for (const entry of readdirSync(channelDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue;
        }

        const file = join(channelDir, entry.name);
        const data = JSON.parse(readFileSync(file, 'utf-8')) as FirmwareReleaseFile;

        releases.push({ file, data });
    }

    return releases.sort((a, b) => {
        // Files sharing a version array would otherwise keep filesystem read order, making the
        // monotonic comparison depend on the platform's readdir order; break ties by file name so
        // the result is reproducible across machines.
        if (versionUtils.isEqual(a.data.version, b.data.version)) {
            return a.file.localeCompare(b.file);
        }

        return versionUtils.isNewer(a.data.version, b.data.version) ? 1 : -1;
    });
};

const collectChannelDirs = (firmwareDir: string): string[] => {
    const channelDirs: string[] = [];

    for (const model of readdirSync(firmwareDir, { withFileTypes: true })) {
        if (!model.isDirectory() || NON_MODEL_DIRS.has(model.name)) {
            continue;
        }

        const modelDir = join(firmwareDir, model.name);

        for (const channel of readdirSync(modelDir, { withFileTypes: true })) {
            if (channel.isDirectory()) {
                channelDirs.push(join(modelDir, channel.name));
            }
        }
    }

    return channelDirs;
};

/**
 * Walks every model/channel sequence of firmware releases (sorted by `version`) and reports any
 * monotonic field whose value is lower than the highest value stated by an earlier release of the
 * same channel. Comparing against that running maximum — rather than only the immediately
 * preceding release — catches a floor that is lowered after being omitted for one or more
 * versions (present, then absent, then present again at a lower value), which a pairwise check
 * silently misses.
 *
 * Exported separately from the requirement so it can be unit tested against synthetic fixtures.
 */
export const findFirmwareReleaseRegressions = (firmwareDir: string): string[] => {
    const errors: string[] = [];

    for (const channelDir of collectChannelDirs(firmwareDir)) {
        const releases = readChannelReleases(channelDir);

        // Per field, the highest floor any earlier release in this channel has stated, plus the
        // version that stated it (for the error message).
        const highestSoFar = new Map<MonotonicField, HighestFloor>();

        for (const release of releases) {
            for (const field of MONOTONIC_FIELDS) {
                const currentValue = release.data[field];

                if (currentValue === undefined) {
                    continue;
                }

                const highest = highestSoFar.get(field);

                if (
                    highest !== undefined &&
                    !versionUtils.isNewerOrEqual(currentValue, highest.value)
                ) {
                    const reportedFile = toReportedPath(firmwareDir, release.file);

                    errors.push(
                        `${reportedFile}: ${field} ${formatVersion(currentValue)} is lower than ` +
                            `${formatVersion(highest.value)} in preceding version ` +
                            `${formatVersion(highest.version)}`,
                    );
                }

                if (highest === undefined || versionUtils.isNewer(currentValue, highest.value)) {
                    highestSoFar.set(field, { value: currentValue, version: release.data.version });
                }
            }
        }
    }

    return errors;
};

/**
 * Verifies that firmware release metadata never regresses: for each model and channel, a higher
 * firmware version must carry version floors (`min_firmware_version`, `min_bootloader_version`,
 * `bootloader_version`) greater than or equal to the highest value stated by any earlier version.
 */
export const requireFirmwareReleaseVersionMonotonicity: Requirement<'repo'> = {
    name: 'firmware-release-version-monotonicity',
    scope: 'repo',
    verify: ({ repoRoot }) =>
        Promise.resolve(findFirmwareReleaseRegressions(join(repoRoot, FIRMWARE_DIR))),
};
