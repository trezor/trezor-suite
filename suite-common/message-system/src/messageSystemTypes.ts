import type {
    Category,
    ExperimentsItem,
    MessageSystem,
    TradingType,
    YieldFlowType,
} from '@suite-common/suite-types';
import type { AccountType, NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';

type EarnDashboardType = 'staking' | 'yield';

export type MessageState = { [key in Category]: boolean };

export type MessageSystemConfigSource = 'remote' | 'local';

export type MessageSystemState = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;
    validMessages: { [key in Category]: string[] };
    dismissedMessages: {
        [key: string]: MessageState;
    };
    validExperiments: string[];
    configSource: MessageSystemConfigSource;
    manuallyAddedMessageIds: Record<string, true>;
    manuallyAddedExperimentIds: Record<string, true>;
    experimentInclusionOverrides?: Record<string, number>;
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
        ada: 'ada.staking.stake',
    },
    unstake: {
        eth: 'eth.staking.unstake',
        sol: 'sol.staking.unstake',
        ada: 'ada.staking.unstake',
    },
    claim: {
        eth: 'eth.staking.claim',
        sol: 'sol.staking.claim',
        ada: 'ada.staking.claim',
    },

    banners: {
        staking: {
            ada: {
                newProvider: 'ada.staking.banner.newProvider',
            },
        },
        dashboard: {
            promo: 'dashboard.promoBanner',
        },
    },

    firmwareRevisionCheck: 'security.firmware.revisionCheck',
    firmwareRevisionCheckMobile: 'security.firmware.revisionCheck.mobile',
    firmwareHashCheck: 'security.firmware.hashCheck',
    // subset of `firmwareHashCheck`: can turn off specifically UI for other-error result
    firmwareHashCheckOtherError: 'security.firmware.hashCheck.otherError',
    // subset of `firmwareHashCheck`: can turn off timeout result, and also may bear `timeoutThresholdsPerModel` payload, see connectInitThunks
    firmwareHashCheckTimeout: 'security.firmware.hashCheck.timeout',

    entropyCheck: 'security.entropyCheck',
    entropyCheckMobile: 'security.entropyCheck.mobile',

    deviceAuthenticityCheckOptiga: 'security.deviceAuthenticityCheck.optiga',
    deviceAuthenticityCheckTropic: 'security.deviceAuthenticityCheck.tropic',
    deviceAuthenticityCheckMCU: 'security.deviceAuthenticityCheck.mcu',

    idCheck: 'security.deviceMetaChecks.id',
    invariabilityCheck: 'security.deviceMetaChecks.invariability',

    trading: {
        buy: 'trading.buy',
        sell: 'trading.sell',
        exchange: 'trading.exchange',
        restrictions: {
            blacklist: 'trading.restrictions.blacklist',
        },
        concierge: 'trading.concierge',
        survey: 'trading.survey',
        slip24: 'trading.slip24',
    },
    earn: {
        dashboard: {
            staking: 'earn.dashboard.staking',
            yield: 'earn.dashboard.yield',
        } as const satisfies Record<EarnDashboardType, string>,
        yield: {
            supply: 'earn.yield.supply',
            withdraw: 'earn.yield.withdraw',
        } as const satisfies Record<YieldFlowType, string>,
    },
    mevProtection: 'settings.mevProtection',
    suiteSync: 'settings.suiteSync',

    // Feature flags implemented only for mobile app
    firmwareUpdate: 'device.firmware.update',
    inAppRating: 'inAppRating',
    demoAccountQuestionnaire: 'demoAccountQuestionnaire',
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

const getEarnDashboardContext = (type: EarnDashboardType) => `earn.dashboard.${type}` as const;

const getEarnYieldContext = (type: YieldFlowType) => `earn.yield.${type}` as const;

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
 * - `getEarnDashboard('yield')` → 'earn.dashboard.yield'
 * - `getEarnYield('supply')` → 'earn.yield.supply'
 * - `getSettings('device')` → 'settings.device'

 */
export const Context = {
    getGeneral: getGeneralContext,
    getAccount: getAccountContext,
    getStaking: getStakingContext,
    getTrading: getTradingContext,
    getEarnDashboard: getEarnDashboardContext,
    getEarnYield: getEarnYieldContext,
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

export enum ExperimentId {
    tradingFeedbackForm = '092db279-98dc-418e-bbfa-ef70716fb211',
    tradingFiatValues = 'b73df44d-37ed-4b66-aba1-5c4164493bae',
}

export type ExperimentsItemType = Omit<ExperimentsItem, 'id'> & { id: ExperimentId };
