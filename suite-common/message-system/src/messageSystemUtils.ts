import {
    type ConditionEvaluationParams,
    getValidExperimentIds as getValidExperimentIdsForPlatform,
    getValidMessages as getValidMessagesForPlatform,
    validateConditions as validateConditionsForPlatform,
} from '@suite-common/message-system-core';
import type {
    Action,
    Category,
    Condition,
    Experiments,
    Localization,
    MessageSystem,
} from '@suite-common/suite-types';
import { exhaustive } from '@trezor/type-utils';

import { getMessageSystemPlatform } from './getMessageSystemPlatform';

export {
    areSettingsCompatible,
    categorizeMessages,
    createVersionRange,
    isCountryCodeCompatible,
    isDeviceCompatible,
    isDurationCompatible,
    isEnvironmentCompatible,
    isTransportCompatible,
    isVersionCompatible,
} from '@suite-common/message-system-core';

export type Options = Omit<ConditionEvaluationParams, 'platform'>;

// In the renderer the platform facts are read from the ambient environment on every evaluation.
// The Electron main process has no `window`, so it passes them to the core explicitly instead.
const toEvaluationParams = (options: Options): ConditionEvaluationParams => ({
    ...options,
    platform: getMessageSystemPlatform(),
});

export const validateConditions = (condition: Condition, options: Options) =>
    validateConditionsForPlatform(condition, toEvaluationParams(options));

export const getValidMessages = (config: MessageSystem | null, options: Options) =>
    getValidMessagesForPlatform(config, toEvaluationParams(options));

export const getValidExperimentIds = (config: MessageSystem | null, options: Options) =>
    getValidExperimentIdsForPlatform(config, toEvaluationParams(options));

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

    return (
        (fallbackLanguage ? localizedMessages[fallbackLanguage] : undefined) ?? localizedMessages.en
    );
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
    banner: Record<never, never>;
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
        name: 'New experiment',
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
