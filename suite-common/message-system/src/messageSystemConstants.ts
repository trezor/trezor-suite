import {
    type CTAAction,
    type Category,
    type Condition,
    type CountryCode,
    type FirmwareVariant,
    type Model,
    type PairingMethod,
    type Variant,
    type Vendor,
} from '@suite-common/suite-types';

import { type Context, ExperimentId, Feature } from './messageSystemTypes';
import { collectStringsDeep, toMessageSystemOptions } from './messageSystemUtils';
import schema from '../schema/config.schema.v1.json';

/*
 * Bump version in case the new version of message system is not backward compatible.
 */
export const VERSION = 1;

export const JWS_SIGN_ALGORITHM = 'ES256';

export const JWS_CONFIG_FILENAME_REMOTE = `config.v${VERSION}.jws`;
export const JWS_CONFIG_FILENAME_LOCAL = `config.v${VERSION}.ts`;

/*
 * On the app launch and then about once in FETCH_INTERVAL_IN_MS, a new config tries to fetch.
 * FETCH_CHECK_INTERVAL_IN_MS is interval for checking if FETCH_INTERVAL_IN_MS already expired.
 * "_MOBILE" variant is used for mobile apps.
 */
export const FETCH_INTERVAL_IN_MS = 60_000; // 1 minute in milliseconds
export const FETCH_INTERVAL_IN_MS_MOBILE = 600_000; // 10 min

export const FETCH_CHECK_INTERVAL_IN_MS = 30_000; // 30 sec
export const FETCH_CHECK_INTERVAL_IN_MS_MOBILE = 180_000; // 3 min

// timeout for fetching remote config
export const FETCH_TIMEOUT_IN_MS = 30_000; // 30 sec

export const CONFIG_URL_REMOTE_BASE = 'https://data.trezor.io/config';
export const CONFIG_URL_REMOTE = {
    stable: `${CONFIG_URL_REMOTE_BASE}/stable/${JWS_CONFIG_FILENAME_REMOTE}`,
    develop: `${CONFIG_URL_REMOTE_BASE}/develop/${JWS_CONFIG_FILENAME_REMOTE}`,
};

export const FEATURE_LIST = collectStringsDeep(Feature).sort();

export const CONTEXT_PATTERNS = {
    getGeneral: {
        pattern: 'dashboard',
        regex: /^dashboard$/,
    },
    getAccount: {
        pattern: 'accounts.{networkSymbol}',
        regex: /^accounts\.[a-z0-9-]+$/,
    },
    getStaking: {
        pattern: 'accounts.{networkSymbol}.staking',
        regex: /^accounts\.[a-z0-9-]+\.staking$/,
    },
    getTrading: {
        pattern: 'trading.{type}',
        regex: /^trading\.(buy|sell|exchange)$/,
    },
    getSettings: {
        pattern: 'settings.{category}',
        regex: /^settings\.(general|device|networks|debug)$/,
    },
    getLegal: {
        pattern: 'legal.{key}',
        regex: /^legal\.[a-z0-9-]+$/,
    },
} as const satisfies Record<keyof typeof Context, { pattern: string; regex: RegExp }>;

export const EXPERIMENT_MAP = Object.fromEntries(
    Object.entries(ExperimentId).map(([name, id]) => [id, name]),
) as Record<ExperimentId, keyof typeof ExperimentId>;

export const CATEGORY_ENUM = schema.definitions.category.enum.sort() as readonly Category[];
export const VARIANT_ENUM = schema.properties.actions.items.properties.message.properties.variant
    .enum as readonly Variant[];
export const COUNTRY_CODES = schema.definitions.countryCodes
    .enum as unknown as readonly CountryCode[];
export const CTA_ACTION_ENUM = schema.properties.actions.items.properties.message.properties.cta
    .properties.action.enum as readonly CTAAction[];
export const MODEL_ENUM = schema.definitions.conditions.items.properties.devices.items.properties
    .model.enum as readonly Model[];
export const FW_VARIANT_ENUM = schema.definitions.conditions.items.properties.devices.items
    .properties.variant.enum as readonly FirmwareVariant[];
export const VENDOR_ENUM = schema.definitions.conditions.items.properties.devices.items.properties
    .vendor.enum as readonly Vendor[];
export const PAIRING_METHOD_ENUM = schema.definitions.conditions.items.properties.devices.items
    .properties.thpProperties.properties.pairingMethods.items.enum as readonly PairingMethod[];

export const CATEGORY_OPTIONS = toMessageSystemOptions(CATEGORY_ENUM);
export const CATEGORY_FILTER_OPTIONS = toMessageSystemOptions([
    'all',
    ...(schema.definitions.category.enum as Category[]),
]);

const CONDITION_KEYS = [
    ...Object.keys(schema.definitions.conditions.items.properties),
].sort() as readonly (keyof Condition)[];

export const CONDITION_OPTIONS = toMessageSystemOptions(CONDITION_KEYS);
