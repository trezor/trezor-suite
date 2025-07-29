import * as semver from 'semver';
import { v4 as uuidv4 } from 'uuid';

import type { CountryCode } from '@suite-common/geolocation';
import { Localization } from '@suite-common/suite-types';
import type {
    Action,
    Category,
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
    getSuiteVersion,
} from '@trezor/env-utils';

import { getCachedOsVersion } from './cachedEnvData';
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
    countryCode: CountryCode | null;
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

export const isDeviceCompatible = (deviceConditions: Device[], device?: TrezorDevice): boolean => {
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

export const validateConditions = (condition: Condition, options: Options) => {
    const { device, transports = [], settings, countryCode } = options;

    const currentOsName = getOsName();
    const currentOsVersion = transformVersionToSemverFormat(getCachedOsVersion());

    const currentBrowserName = getBrowserName();
    const currentBrowserVersion = transformVersionToSemverFormat(getBrowserVersion());

    const environment = getEnvironment();
    const suiteVersion = transformVersionToSemverFormat(getSuiteVersion());
    const commitHash = getCommitHash();

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
        !isEnvironmentCompatible(environmentCondition, environment, suiteVersion, commitHash)
    ) {
        return false;
    }

    if (osCondition && !isVersionCompatible(osCondition, currentOsName, currentOsVersion)) {
        return false;
    }

    if (
        environment === 'web' &&
        browserCondition &&
        !isVersionCompatible(browserCondition, currentBrowserName, currentBrowserVersion)
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

export const getValidMessages = (config: MessageSystem | null, options: Options): Message[] => {
    if (!config) {
        return [];
    }

    return config.actions
        .filter(
            action =>
                !action.conditions.length ||
                action.conditions.some(condition => validateConditions(condition, options)),
        )
        .map(action => action.message);
};

export const getValidExperimentIds = (config: MessageSystem | null, options: Options): string[] => {
    if (!config?.experiments) {
        return [];
    }

    return config.experiments
        .filter(
            experiment =>
                !experiment.conditions.length ||
                experiment.conditions.some(condition => validateConditions(condition, options)),
        )
        .map(experiment => experiment?.experiment?.id);
};

/**
 * Attempts to return the message content for the exact language code. If not found,
 * it falls back to the base language (e.g., 'en' from 'en-US'). If neither is available,
 * it defaults to 'en'.
 */
export const resolveMessageContent = (localizedMessages: Localization, language: string) => {
    if (localizedMessages[language]) {
        return localizedMessages[language];
    }

    const fallbackLanguage = language.split('-')[0];

    return localizedMessages[fallbackLanguage] ?? localizedMessages.en;
};

export const toMessageSystemOptions = <T extends string>(
    values: readonly T[],
): ReadonlyArray<{ label: string; value: T }> =>
    values.map(value => ({
        value,
        label: value.replace(/^./, char => char.toUpperCase()),
    }));

export const getDefaultActionByCategory = (category: Category): Action => {
    const defaultLocalization = {
        en: '',
        cs: '',
        es: '',
        de: '',
        fr: '',
        pt: '',
    };

    const baseMessage = {
        id: uuidv4(),
        priority: 100,
        dismissible: true,
        variant: 'info' as const,
        category,
        content: defaultLocalization,
    };

    const extraFields = (() => {
        switch (category) {
            case 'modal':
                return {
                    modal: {
                        title: defaultLocalization,
                        image: '',
                    },
                };
            case 'context':
                return {
                    context: {
                        domain: '',
                    },
                };
            case 'feature':
                return {
                    feature: [
                        {
                            domain: '',
                            flag: true,
                        },
                    ],
                };
            case 'banner':
            default:
                return {};
        }
    })();

    return {
        message: {
            ...baseMessage,
            ...extraFields,
        },
        conditions: [{}],
    };
};

export const getDefaultConditionValue = (key: string) => {
    switch (key) {
        case 'duration': {
            const now = new Date();
            const from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const to = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

            return { from, to };
        }

        case 'environment':
            return { desktop: '*', mobile: '*', web: '*' };

        case 'os':
            return {
                macos: '*',
                linux: '*',
                windows: '*',
                android: '*',
                ios: '*',
                chromeos: '*',
            };

        case 'browser':
            return { firefox: '*', chrome: '*', chromium: '*' };

        case 'transport':
            return { bridge: '*', webusbplugin: '*' };

        case 'settings':
            return [{ tor: false }];

        case 'devices':
            return [
                {
                    model: 'T3T1',
                    firmwareRevision: '*',
                    firmware: '*',
                    bootloader: '*',
                    variant: '*',
                    vendor: '*',
                },
            ];

        case 'countryCodes':
            return ['CZ'];

        default:
            return {};
    }
};
