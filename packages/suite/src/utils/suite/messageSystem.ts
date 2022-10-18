import * as semver from 'semver';

import { getEnvironment } from '@suite-utils/env';
import { getBrowserName, getBrowserVersion, getOsName, getOsVersion } from '@trezor/env-utils';
import { getBootloaderVersion, getDeviceModel, getFwRevision, getFwVersion } from './device';

import type { TransportInfo } from '@trezor/connect';

import type { Network } from '@wallet-types';
import type { EnvironmentType, TrezorDevice } from '@suite-types';
import type {
    Duration,
    MessageSystem,
    Message,
    Version,
    Settings,
    Transport,
    Device,
    Environment,
} from '@trezor/message-system';

type CurrentSettings = {
    tor: boolean;
    enabledNetworks: Network['symbol'][];
};

type Options = {
    settings: CurrentSettings;
    transport?: Partial<TransportInfo>;
    device?: TrezorDevice;
};

/**
 * Creates a version range by chaining single versions using '||' delimiter.
 * Optimized for 'satisfies' function from 'semver' library.
 * @param {Version} versions
 * @returns {string | null}
 */
export const createVersionRange = (versions: Version | undefined): string | null => {
    // if version range is 'null' then the 'satisfies' always returns false
    if (versions === undefined || versions === '!') {
        return null;
    }

    if (typeof versions === 'string') {
        return versions;
    }

    return versions.join(' || ');
};

const transformVersionToSemverFormat = (version: string | undefined): string =>
    semver.valid(semver.coerce(version)) || '';

export const validateDurationCompatibility = (durationCondition: Duration): boolean => {
    const currentDate = Date.now();

    const from = Date.parse(durationCondition.from);
    const to = Date.parse(durationCondition.to);

    return from <= currentDate && currentDate <= to;
};

export const validateVersionCompatibility = (
    condition: { [key: string]: Version | undefined },
    type: string,
    version: string,
): boolean => {
    const conditionVersion = createVersionRange(condition[type]);

    if (conditionVersion === null) {
        return false;
    }

    return semver.satisfies(version, conditionVersion);
};

export const validateSettingsCompatibility = (
    settingsCondition: Settings[],
    currentSettings: CurrentSettings,
): boolean => {
    const settings: {
        [key: string]: any;
    } = currentSettings.enabledNetworks.reduce((o, key) => Object.assign(o, { [key]: true }), {
        tor: currentSettings.tor,
    });

    return settingsCondition.some(settingCondition =>
        Object.entries(settingCondition).every(
            ([key, value]: [string, boolean | unknown]) =>
                settings[key] === value || (!value && settings[key] === undefined),
        ),
    );
};

export const validateTransportCompatibility = (
    transportCondition: Transport,
    transport?: Partial<TransportInfo>,
): boolean => {
    if (!transport || !transport.type || !transport.version) {
        return false;
    }

    const { version } = transport;
    const type = transport.type.toLowerCase();

    return validateVersionCompatibility(transportCondition, type, version);
};

export const validateDeviceCompatibility = (
    deviceConditions: Device[],
    device?: TrezorDevice,
): boolean => {
    // if device conditions are empty, then device should be empty
    if (!deviceConditions.length) {
        return !device;
    }
    if (!device || !device.features) {
        return false;
    }

    const deviceFwVersion = getFwVersion(device);
    const deviceBootloaderVersion = getBootloaderVersion(device);
    const deviceFwRevision = getFwRevision(device);
    const deviceFwVariant = device.firmwareType === 'bitcoin-only' ? 'bitcoin-only' : 'regular';
    const deviceModel = getDeviceModel(device).toLowerCase();
    const deviceVendor = device.features.vendor.toLowerCase();

    return deviceConditions.some(deviceCondition => {
        const {
            model: modelCondition,
            vendor: vendorCondition,
            firmwareRevision: firmwareRevisionCondition,
            firmware: firmwareCondition,
            bootloader: bootloaderCondition,
            variant: variantCondition,
        } = deviceCondition;

        return (
            modelCondition.toLowerCase() === deviceModel &&
            (vendorCondition.toLowerCase() === deviceVendor || vendorCondition === '*') &&
            (variantCondition.toLowerCase() === deviceFwVariant || variantCondition === '*') &&
            (firmwareRevisionCondition.toLowerCase() === deviceFwRevision.toLowerCase() ||
                firmwareRevisionCondition === '*') &&
            (semver.satisfies(deviceFwVersion, createVersionRange(firmwareCondition)!) ||
                firmwareCondition === '*') &&
            (semver.satisfies(deviceBootloaderVersion, createVersionRange(bootloaderCondition)!) ||
                bootloaderCondition === '*')
        );
    });
};

export const validateEnvironmentCompatibility = (
    environmentCondition: Environment,
    environment: EnvironmentType,
    suiteVersion: string,
    commitHash: string | undefined,
) => {
    const { revision, desktop, web, mobile } = environmentCondition;

    return (
        validateVersionCompatibility(
            {
                desktop,
                web,
                mobile,
            },
            environment,
            suiteVersion,
        ) &&
        (revision === commitHash || revision === '*' || revision === undefined)
    );
};

export const getValidMessages = (config: MessageSystem | null, options: Options): Message[] => {
    if (!config) {
        return [];
    }

    const { device, transport, settings } = options;

    const currentOsName = getOsName();
    const currentOsVersion = transformVersionToSemverFormat(getOsVersion());

    const currentBrowserName = getBrowserName();
    const currentBrowserVersion = transformVersionToSemverFormat(getBrowserVersion());

    const environment = getEnvironment();
    const suiteVersion = transformVersionToSemverFormat(process.env.VERSION);
    const commitHash = process.env.COMMITHASH;

    return config.actions
        .filter(
            action =>
                !action.conditions.length ||
                action.conditions.some(condition => {
                    const {
                        duration: durationCondition,
                        environment: environmentCondition,
                        os: osCondition,
                        browser: browserCondition,
                        transport: transportCondition,
                        settings: settingsCondition,
                        devices: deviceCondition,
                    } = condition;

                    if (durationCondition && !validateDurationCompatibility(durationCondition)) {
                        return false;
                    }

                    if (
                        environmentCondition &&
                        !validateEnvironmentCompatibility(
                            environmentCondition,
                            environment,
                            suiteVersion,
                            commitHash,
                        )
                    ) {
                        return false;
                    }

                    if (
                        osCondition &&
                        !validateVersionCompatibility(osCondition, currentOsName, currentOsVersion)
                    ) {
                        return false;
                    }

                    if (
                        environment === 'web' &&
                        browserCondition &&
                        !validateVersionCompatibility(
                            browserCondition,
                            currentBrowserName,
                            currentBrowserVersion,
                        )
                    ) {
                        return false;
                    }

                    if (
                        settingsCondition &&
                        !validateSettingsCompatibility(settingsCondition, settings)
                    ) {
                        return false;
                    }

                    if (
                        transportCondition &&
                        !validateTransportCompatibility(transportCondition, transport)
                    ) {
                        return false;
                    }

                    if (deviceCondition && !validateDeviceCompatibility(deviceCondition, device)) {
                        return false;
                    }

                    return true;
                }),
        )
        .map(action => action.message);
};
