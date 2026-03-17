import * as semver from 'semver';
import { v4 as uuidv4 } from 'uuid';

import type { CountryCode } from '@suite-common/geolocation';
import {
    type Action,
    type Category,
    type Condition,
    type Device,
    type Duration,
    type Environment,
    type Experiments,
    type Localization,
    type Message,
    type MessageSystem,
    type Settings,
    type Transport,
    type TrezorDevice,
    type TrezorHostProtocolTHPProperties,
    type Version,
} from '@suite-common/suite-types';
import { getBrowserName, getBrowserVersion } from '@suite-common/suite-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { TransportInfo } from '@trezor/connect';
import {
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';
import {
    type Environment as EnvironmentType,
    getCommitHash,
    getEnvironment,
    getOsName,
    getSuiteVersion,
} from '@trezor/env-utils';
import { exhaustive } from '@trezor/type-utils';

import { getCachedOsVersion } from './cachedEnvData';
import { type ValidMessagesPayload } from './messageSystemActions';

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
            thpProperties: thpPropertiesCondition,
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

/** Recursively collects all string leaf values from arrays/objects. */
export const collectStringsDeep = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(collectStringsDeep);
    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).flatMap(collectStringsDeep);
    }

    return [];
};

/** Format a string or string[] into a single string joined by `separator` (default: ", "). */
export const toCommaSeparated = (value: string | string[], separator = ', '): string =>
    Array.isArray(value) ? value.join(separator) : value;

const defaultLocalization = {
    en: '',
    cs: '',
    es: '',
    de: '',
    fr: '',
    pt: '',
} as const satisfies Localization;

type ExtraByCategory = {
    modal: { modal: { title: Localization; image: string } };
    context: { context: { domain: string } };
    feature: { feature: Array<{ domain: string; flag: boolean }> };
    banner: {};
};

const EXTRA_BY_CATEGORY = {
    modal: {
        modal: {
            title: defaultLocalization,
            image: '',
        },
    },
    context: {
        context: {
            domain: '',
        },
    },
    feature: {
        feature: [
            {
                domain: '',
                flag: true,
            },
        ],
    },
    banner: {},
} as const satisfies Record<Category, ExtraByCategory[Category]>;

export const getDefaultActionByCategory = (category: Category): Action => {
    const baseMessage = {
        id: uuidv4(),
        priority: 100,
        dismissible: true,
        variant: 'info' as const,
        category,
        content: defaultLocalization,
    };

    return {
        message: {
            ...baseMessage,
            ...EXTRA_BY_CATEGORY[category],
        },
        conditions: [{}],
    };
};

export const getDefaultExperiment = (): Experiments => ({
    experiment: {
        id: uuidv4(),
        groups: [
            {
                variant: 'A',
                percentage: 50,
            },
            {
                variant: 'B',
                percentage: 50,
            },
        ],
    },
    conditions: [{}],
});

export const getDefaultConditionValue = (key: keyof Condition): Condition[keyof Condition] => {
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
                    model: 'T3W1',
                    firmwareRevision: '*',
                    firmware: '*',
                    bootloader: '*',
                    variant: '*',
                    vendor: '*',
                    thpProperties: {
                        internalModel: 'T3W1',
                        modelVariant: 2,
                        protocolVersionMajor: 2,
                        protocolVersionMinor: 0,
                        pairingMethods: ['CodeEntry'],
                    },
                },
            ];

        case 'countryCodes':
            return ['CZ'];

        default:
            return exhaustive(key);
    }
};
