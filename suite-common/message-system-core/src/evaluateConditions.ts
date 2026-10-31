import * as semver from 'semver';

import type { CountryCode } from '@suite-common/geolocation';
import type {
    Condition,
    Device,
    Duration,
    Environment,
    Message,
    MessageSystem,
    Settings,
    Transport,
    TrezorDevice,
    TrezorHostProtocolTHPProperties,
    Version,
} from '@suite-common/suite-types';
import type { TransportInfo } from '@trezor/connect';
import {
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';
import type { Environment as EnvironmentType } from '@trezor/env-utils';

import type { ConditionEvaluationParams, MessageSystemSettings } from './types';

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

export const isDurationCompatible = (durationCondition: Duration): boolean => {
    const currentDate = Date.now();

    const from = Date.parse(durationCondition.from);
    const to = Date.parse(durationCondition.to);

    return from <= currentDate && currentDate <= to;
};

export const isVersionCompatible = (
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

export const areSettingsCompatible = (
    settingsCondition: Settings[],
    currentSettings: MessageSystemSettings,
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

export const isTransportCompatible = (
    transportCondition: Transport,
    transports: TransportInfo[],
): boolean =>
    transports
        .flatMap(t => {
            if (!t.type || !t.version) return [];
            // transport names were changed in https://github.com/trezor/trezor-suite/pull/7411
            // to avoid breaking changes with v1 messaging system schema, we introduce this translation
            if (t.type === 'BridgeTransport') return [{ type: 'bridge', version: t.version }, t];
            if (t.type === 'WebUsbTransport')
                return [{ type: 'webusbplugin', version: t.version }, t];

            return [t];
        })
        .some(({ type, version }) => isVersionCompatible(transportCondition, type, version));

const isThpPropertiesCompatible = (
    condition?: TrezorHostProtocolTHPProperties,
    device?: NonNullable<TrezorDevice['thp']>['properties'],
) => {
    if (!condition) return true;

    if (!device) return false;

    if (
        condition.internalModel &&
        device.internal_model?.toLowerCase() !== condition.internalModel.toLowerCase()
    ) {
        return false;
    }

    if (condition.modelVariant !== undefined && device.model_variant !== condition.modelVariant) {
        return false;
    }

    if (
        condition.protocolVersionMajor !== undefined &&
        device.protocol_version_major !== condition.protocolVersionMajor
    ) {
        return false;
    }

    if (
        condition.protocolVersionMinor !== undefined &&
        device.protocol_version_minor !== condition.protocolVersionMinor
    ) {
        return false;
    }

    if (condition.pairingMethods?.length) {
        if (!device.pairing_methods?.length) return false;

        if (!condition.pairingMethods.every(method => device.pairing_methods.includes(method))) {
            return false;
        }
    }

    return true;
};

export const isDeviceCompatible = (deviceConditions: Device[], device?: TrezorDevice): boolean => {
    // if device conditions are empty, then device should be empty
    if (!deviceConditions.length) {
        return !device;
    }
    if (!device?.features) {
        return false;
    }

    const deviceFwVersion = getFirmwareVersion(device);
    const deviceBootloaderVersion = getBootloaderVersion(device);
    const deviceFwRevision = getFirmwareRevision(device);
    const deviceFwType = device.firmwareType;
    const deviceInternalModel = device.features.internal_model.toLowerCase();
    const deviceVendor = device.features.vendor?.toLowerCase();

    return deviceConditions.some(deviceCondition => {
        const {
            model: modelCondition,
            vendor: vendorCondition,
            firmwareRevision: firmwareRevisionCondition,
            firmware: firmwareCondition,
            bootloader: bootloaderCondition,
            variant: variantCondition,
            thpProperties: thpPropertiesCondition,
        } = deviceCondition;

        // createVersionRange returns null for '!' / undefined, which by design must not match
        // (see isVersionCompatible for the same handling).
        const firmwareRange = createVersionRange(firmwareCondition);
        const bootloaderRange = createVersionRange(bootloaderCondition);

        return (
            modelCondition.toLowerCase() === deviceInternalModel &&
            (vendorCondition.toLowerCase() === deviceVendor || vendorCondition === '*') &&
            (variantCondition.toLowerCase() === deviceFwType || variantCondition === '*') &&
            (firmwareRevisionCondition.toLowerCase() === deviceFwRevision.toLowerCase() ||
                firmwareRevisionCondition === '*') &&
            ((firmwareRange !== null && semver.satisfies(deviceFwVersion, firmwareRange)) ||
                firmwareCondition === '*') &&
            ((bootloaderRange !== null &&
                semver.satisfies(deviceBootloaderVersion, bootloaderRange)) ||
                bootloaderCondition === '*') &&
            isThpPropertiesCompatible(thpPropertiesCondition, device.thp?.properties)
        );
    });
};

export const isEnvironmentCompatible = (
    environmentCondition: Environment,
    environment: EnvironmentType,
    suiteVersion: string,
    commitHash: string | undefined,
) => {
    const { revision, desktop, web, mobile } = environmentCondition;

    return (
        isVersionCompatible({ desktop, web, mobile }, environment, suiteVersion) &&
        (revision === commitHash || revision === '*' || revision === undefined)
    );
};

export const isCountryCodeCompatible = (
    allowedCountryCodes: CountryCode[],
    userCountryCode: CountryCode,
): boolean => {
    if (!allowedCountryCodes.length) {
        return true;
    }

    return allowedCountryCodes.some(
        location => location.toUpperCase() === userCountryCode.toUpperCase(),
    );
};

export const validateConditions = (condition: Condition, params: ConditionEvaluationParams) => {
    const { device, transports = [], settings, countryCode, platform } = params;

    const currentOsVersion = transformVersionToSemverFormat(platform.osVersion);
    const currentBrowserVersion = transformVersionToSemverFormat(platform.browserVersion);
    const suiteVersion = transformVersionToSemverFormat(platform.suiteVersion);

    const {
        duration: durationCondition,
        environment: environmentCondition,
        os: osCondition,
        browser: browserCondition,
        transport: transportCondition,
        settings: settingsCondition,
        devices: deviceCondition,
        countryCodes: countryCodeCondition,
    } = condition;

    if (durationCondition && !isDurationCompatible(durationCondition)) {
        return false;
    }

    if (
        environmentCondition &&
        !isEnvironmentCompatible(
            environmentCondition,
            platform.suiteEnvironment,
            suiteVersion,
            platform.commitHash,
        )
    ) {
        return false;
    }

    if (osCondition && !isVersionCompatible(osCondition, platform.osName, currentOsVersion)) {
        return false;
    }

    if (
        platform.suiteEnvironment === 'web' &&
        browserCondition &&
        !isVersionCompatible(browserCondition, platform.browserName, currentBrowserVersion)
    ) {
        return false;
    }

    if (settingsCondition && !areSettingsCompatible(settingsCondition, settings)) {
        return false;
    }

    if (transportCondition && !isTransportCompatible(transportCondition, transports)) {
        return false;
    }

    if (deviceCondition && !isDeviceCompatible(deviceCondition, device)) {
        return false;
    }

    if (
        countryCodeCondition &&
        (!countryCode || !isCountryCodeCompatible(countryCodeCondition, countryCode))
    ) {
        return false;
    }

    return true;
};

export const getValidMessages = (
    config: MessageSystem | null,
    params: ConditionEvaluationParams,
): Message[] => {
    if (!config) {
        return [];
    }

    return config.actions
        .filter(
            action =>
                !action.conditions.length ||
                action.conditions.some(condition => validateConditions(condition, params)),
        )
        .map(action => action.message);
};

export const getValidExperimentIds = (
    config: MessageSystem | null,
    params: ConditionEvaluationParams,
): string[] => {
    if (!config?.experiments) {
        return [];
    }

    return config.experiments
        .filter(
            experiment =>
                !experiment.conditions.length ||
                experiment.conditions.some(condition => validateConditions(condition, params)),
        )
        .map(experiment => experiment?.experiment?.id);
};
