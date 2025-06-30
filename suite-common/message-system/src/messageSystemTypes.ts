import type { Category, ExperimentsItem, MessageSystem } from '@suite-common/suite-types';
import type { TradingType } from '@suite-common/trading';
import type { AccountType, NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';

export type MessageState = { [key in Category]: boolean };

export type MessageSystemState = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;
    validMessages: { [key in Category]: string[] };
    dismissedMessages: {
        [key: string]: MessageState;
    };
    validExperiments: string[];
};

export type MessageSystemRootState = {
    messageSystem: MessageSystemState;
};

// Note: do not rename the feature flag identifiers (otherwise, both old & new would have to be targeted by a message system release)
export const Feature = {
    coinjoin: 'coinjoin',
    killswitch: 'killswitch',
    stake: {
        eth: 'eth.staking.stake',
        sol: 'sol.staking.stake',
    },
    unstake: {
        eth: 'eth.staking.unstake',
        sol: 'sol.staking.unstake',
    },
    claim: {
        eth: 'eth.staking.claim',
        sol: 'sol.staking.claim',
    },
    firmwareRevisionCheck: 'security.firmware.revisionCheck',
    firmwareRevisionCheckMobile: 'security.firmware.revisionCheck.mobile',
    firmwareHashCheck: 'security.firmware.hashCheck',
    // subset of `firmwareHashCheck`: can turn off specifically UI for other-error result
    firmwareHashCheckOtherError: 'security.firmware.hashCheck.otherError',
    entropyCheck: 'security.entropyCheck',
    entropyCheckMobile: 'security.entropyCheck.mobile',
    // FW update feature flag implemented only for mobile app
    firmwareUpdate: 'device.firmware.update',
    trading: {
        buy: 'trading.buy',
        sell: 'trading.sell',
        exchange: 'trading.exchange',
    },

    // device onboarding (MOBILE ONLY!!!).
    // TODO: remove during August 2025 release if is everything still working as expected
    // https://github.com/trezor/trezor-suite/issues/19449
    deviceOnboardingMobile: 'device.onboarding.mobile', // for all device models (including T2T1)
    deviceOnboardingMobileT2T1: 'device.onboarding.T2T1.mobile', // specifically for T2T1 devices
    deviceOnboardingMobileRecovery: 'device.onboarding.mobile.recovery', // seed recovery flow
} as const;

type ExtractFeatureValues<T> =
    T extends Record<string, infer U>
        ? U extends Record<string, any>
            ? ExtractFeatureValues<U>
            : U
        : never;

export type FeatureDomain = ExtractFeatureValues<typeof Feature>;

export type GeneralContextKey = 'dashboard';
const getGeneralContext = (key: GeneralContextKey) => key;

const getAccountContext = (networkSymbol: NetworkSymbol, accountType?: AccountType) =>
    accountType
        ? (`accounts.${networkSymbol}.${accountType}` as const)
        : (`accounts.${networkSymbol}` as const);

const getStakingContext = (networkSymbol: StakingNetworkSymbol) =>
    `accounts.${networkSymbol}.staking` as const;

const getTradingContext = (type: TradingType) => `trading.${type}` as const;

export type SettingsCategory = 'general' | 'device' | 'networks' | 'debug';
const getSettingsContext = (category: SettingsCategory) => `settings.${category}` as const;

export type LegalContextKey = 'gateway';
const getLegalContext = (key: LegalContextKey) => `legal.${key}` as const;

/**
 * Factory object for generating typed context keys used by the Message System.
 *
 * This API provides helper methods to construct string keys for different
 * parts of the app (accounts, staking, trading, settings, etc.) in a type-safe way.
 *
 * Use cases:
 * - `getGeneral('dashboard')` → 'dashboard'
 * - `getAccounts('btc')` → 'accounts.btc'
 * - `getAccounts('btc', 'legacy')` → 'accounts.btc.legacy'
 * - `getStaking('eth')` → 'accounts.eth.staking'
 * - `getTrading('buy')` → 'trading.buy'
 * - `getSettings('device')` → 'settings.device'

 */
export const Context = {
    getGeneral: getGeneralContext,
    getAccount: getAccountContext,
    getStaking: getStakingContext,
    getTrading: getTradingContext,
    getSettings: getSettingsContext,
    getLegal: getLegalContext,
} as const;

type FunctionKeysOf<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type FunctionContextReturnValues = {
    [K in FunctionKeysOf<typeof Context>]: ReturnType<(typeof Context)[K]>;
}[FunctionKeysOf<typeof Context>];

export type ContextDomain = FunctionContextReturnValues;

export const Experiment = {
    // e.g. orangeSendButton: 'fb0eb1bc-8ec3-44d4-98eb-53301d73d981',
} as const;

export type ExperimentId = (typeof Experiment)[keyof typeof Experiment];

export type ExperimentsItemType = Omit<ExperimentsItem, 'id'> & { id: ExperimentId };
