import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { PerformancePlatform, PerformanceReportMeta } from './types';

const UNKNOWN = 'unknown';

type DetoxDeviceConfig = {
    type?: string;
    device?: string | { avdName?: string; type?: string; name?: string };
};

type DetoxConfigShape = {
    devices?: Record<string, DetoxDeviceConfig>;
    configurations?: Record<string, { device?: string | DetoxDeviceConfig }>;
};

/** Detox configuration names are `<platform>.<device>.<buildType>`, e.g. `android.emu.release`. */
export const resolvePlatform = (detoxConfigurations: readonly string[]): PerformancePlatform => {
    const platforms = new Set(
        detoxConfigurations.map(configuration => configuration.split('.')[0]),
    );

    if (platforms.size !== 1) {
        return UNKNOWN;
    }
    if (platforms.has('android')) {
        return 'android';
    }
    if (platforms.has('ios')) {
        return 'ios';
    }

    return UNKNOWN;
};

const toDeviceName = (device: DetoxDeviceConfig | undefined): string | undefined => {
    if (typeof device?.device === 'string' || device?.device === undefined) {
        return device?.type;
    }

    return device.device.avdName ?? device.device.name ?? device.device.type ?? device.type;
};

/** The emulator or simulator the configurations of this run were executed on. */
export const resolveDevice = (
    detoxConfig: DetoxConfigShape,
    detoxConfigurations: readonly string[],
): string => {
    const names = detoxConfigurations.map(configurationName => {
        const configuration = detoxConfig.configurations?.[configurationName];
        const device =
            typeof configuration?.device === 'string'
                ? detoxConfig.devices?.[configuration.device]
                : configuration?.device;

        return toDeviceName(device) ?? UNKNOWN;
    });

    const unique = [...new Set(names)].filter(name => name !== UNKNOWN);

    return unique.length > 0 ? unique.join(', ') : UNKNOWN;
};

const readJsonFile = (filePath: string): Record<string, unknown> | null => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    } catch {
        return null;
    }
};

const readDetoxConfig = (appDir: string): DetoxConfigShape => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(path.resolve(appDir, '.detoxrc.js')) as DetoxConfigShape;
    } catch {
        return {};
    }
};

const resolveAppVersion = (appDir: string): string => {
    const packageJson = readJsonFile(path.resolve(appDir, 'package.json'));
    const version = packageJson?.suiteNativeVersion;

    return typeof version === 'string' ? version : UNKNOWN;
};

/**
 * On CI the checked-out commit is in the environment; `git rev-parse` is the local fallback and can
 * legitimately fail (shallow clone, no git binary), which must not cost us the whole report.
 */
const resolveCommitHash = (appDir: string): string => {
    const fromCi = process.env.GITHUB_SHA;

    if (fromCi) {
        return fromCi;
    }

    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appDir, encoding: 'utf8' }).trim();
    } catch {
        return UNKNOWN;
    }
};

export const resolveReportMeta = (
    appDir: string,
    detoxConfigurations: readonly string[],
): Omit<PerformanceReportMeta, 'sampleCount'> => ({
    platform: resolvePlatform(detoxConfigurations),
    device: resolveDevice(readDetoxConfig(appDir), detoxConfigurations),
    appVersion: resolveAppVersion(appDir),
    commitHash: resolveCommitHash(appDir),
    generatedAt: new Date().toISOString(),
});
