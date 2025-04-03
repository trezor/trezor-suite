import * as semver from 'semver';

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
    Version,
} from '@suite-common/suite-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { TransportInfo } from '@trezor/connect';
import {
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';
import {
    Environment as EnvironmentType,
    getBrowserName,
    getBrowserVersion,
    getCommitHash,
    getEnvironment,
    getOsName,
    getOsVersion,
    getSuiteVersion,
} from '@trezor/env-utils';

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
    enabledNetworks: NetworkSymbol[];
};

export type Options = {
    settings: CurrentSettings;
    transports?: TransportInfo[];
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
        .some(({ type, version }) =>
            validateVersionCompatibility(transportCondition, type, version),
        );

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
        validateVersionCompatibility({ desktop, web, mobile }, environment, suiteVersion) &&
        (revision === commitHash || revision === '*' || revision === undefined)
    );
};

type EnvData = {
    osName: ReturnType<typeof getOsName>;
    osVersion: ReturnType<typeof transformVersionToSemverFormat>;
    browserName: ReturnType<typeof getBrowserName>;
    browserVersion: ReturnType<typeof transformVersionToSemverFormat>;
    environment: ReturnType<typeof getEnvironment>;
    suiteVersion: ReturnType<typeof transformVersionToSemverFormat>;
    commitHash: ReturnType<typeof getCommitHash>;
};

export const getEnvData = async (): Promise<EnvData> => ({
    osName: getOsName(),
    osVersion: transformVersionToSemverFormat(await getOsVersion()),

    browserName: getBrowserName(),
    browserVersion: transformVersionToSemverFormat(getBrowserVersion()),

    environment: getEnvironment(),
    suiteVersion: transformVersionToSemverFormat(getSuiteVersion()),
    commitHash: getCommitHash(),
});

export const validateConditions = (condition: Condition, options: Options, envData: EnvData) => {
    const { device, transports = [], settings } = options;

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
            envData.environment,
            envData.suiteVersion,
            envData.commitHash,
        )
    ) {
        return false;
    }

    if (
        osCondition &&
        !validateVersionCompatibility(osCondition, envData.osName, envData.osVersion)
    ) {
        return false;
    }

    if (
        envData.environment === 'web' &&
        browserCondition &&
        !validateVersionCompatibility(browserCondition, envData.browserName, envData.browserVersion)
    ) {
        return false;
    }

    if (settingsCondition && !validateSettingsCompatibility(settingsCondition, settings)) {
        return false;
    }

    if (transportCondition && !validateTransportCompatibility(transportCondition, transports)) {
        return false;
    }

    if (deviceCondition && !validateDeviceCompatibility(deviceCondition, device)) {
        return false;
    }

    return true;
};

export const getValidMessages = async (
    config: MessageSystem | null,
    options: Options,
): Promise<Message[]> => {
    if (!config) {
        return [];
    }
    const envData = await getEnvData();

    return config.actions
        .filter(
            action =>
                !action.conditions.length ||
                action.conditions.some(condition =>
                    validateConditions(condition, options, envData),
                ),
        )
        .map(action => action.message);
};

export const getValidExperimentIds = async (
    config: MessageSystem | null,
    options: Options,
): Promise<string[]> => {
    if (!config?.experiments) {
        return [];
    }
    const envData = await getEnvData();

    return config.experiments
        .filter(
            experiment =>
                !experiment.conditions.length ||
                experiment.conditions.some(condition =>
                    validateConditions(condition, options, envData),
                ),
        )
        .map(experiment => experiment?.experiment?.id);
};
