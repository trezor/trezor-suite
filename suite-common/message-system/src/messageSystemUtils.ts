import * as semver from 'semver';

import {
    getEnvironment,
    getBrowserName,
    getBrowserVersion,
    getCommitHash,
    getOsName,
    getOsVersion,
    getSuiteVersion,
    Environment as EnvironmentType,
} from '@trezor/env-utils';
import type {
    TrezorDevice,
    Duration,
    MessageSystem,
    Message,
    Version,
    Settings,
    Transport,
    Device,
    Environment,
} from '@suite-common/suite-types';
import type { Network } from '@suite-common/wallet-config';
import type { TransportInfo } from '@trezor/connect';
import {
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';

import { ValidMessagesPayload } from './messageSystemActions';

export const categorizeMessages = (messages: Message[]): ValidMessagesPayload => {
    const validMessages: ValidMessagesPayload = {
        banner: [],
        modal: [],
        context: [],
        feature: [],
    };

    messages.forEach(message => {
        const { category } = message;

        if (typeof category === 'string') {
            // can be just one category
            validMessages[category]?.push(message.id);
        } else if (Array.isArray(category)) {
            // also can be array of categories
            category.forEach(categoryKey => validMessages[categoryKey]?.push(message.id));
        }
    });

    return validMessages;
};

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

    // transport names were changed in https://github.com/trezor/trezor-suite/pull/7411
    // to avoid breaking changes with v1 messaging system schema, we introduce this translation
    let legacyTransportType: 'bridge' | 'webusbplugin' | undefined;

    if (type === 'BridgeTransport') {
        legacyTransportType = 'bridge';
    } else if (type === 'WebUsbTransport') {
        legacyTransportType = 'webusbplugin';
    }

    return validateVersionCompatibility(transportCondition, legacyTransportType || type, version);
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

    const deviceFwVersion = getFirmwareVersion(device);
    const deviceBootloaderVersion = getBootloaderVersion(device);
    const deviceFwRevision = getFirmwareRevision(device);
    const deviceFwType = device.firmwareType;
    const deviceInternalModel = device.features.internal_model.toLowerCase();
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
            modelCondition.toLowerCase() === deviceInternalModel &&
            (vendorCondition.toLowerCase() === deviceVendor || vendorCondition === '*') &&
            (variantCondition.toLowerCase() === deviceFwType || variantCondition === '*') &&
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
    const suiteVersion = transformVersionToSemverFormat(getSuiteVersion());
    const commitHash = getCommitHash();

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
