import type {
    Category,
    ExperimentsItem,
    MessageSystem,
    TradingType,
    WrappedNativeFlowType,
    YieldFlowType,
} from '@suite-common/suite-types';
import type { AccountType, NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';

export type EarnDashboardType = 'staking' | 'yield';

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
        trx: 'trx.staking.stake',
    },
    unstake: {
        eth: 'eth.staking.unstake',
        sol: 'sol.staking.unstake',
        ada: 'ada.staking.unstake',
        trx: 'trx.staking.unstake',
    },
    claim: {
        eth: 'eth.staking.claim',
        sol: 'sol.staking.claim',
        ada: 'ada.staking.claim',
        trx: 'trx.staking.claim',
    },
    vote: {
        ada: 'ada.staking.vote',
        trx: 'trx.staking.vote',
    },
    withdraw: {
        trx: 'trx.staking.withdraw',
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

    // Disables firmware revision check UI, making it silent on Desktop/Web.
    firmwareRevisionCheck: 'security.firmware.revisionCheck',
    // Like `firmwareRevisionCheck` for Mobile. DO NOT separate flags per platform, rather use conditions in the message. Kept here for compatibility.
    firmwareRevisionCheckMobile: 'security.firmware.revisionCheck.mobile',
    // Disables firmware hash check UI, making it silent.
    firmwareHashCheck: 'security.firmware.hashCheck',
    // Subset of `firmwareHashCheck`: disables specifically UI for other-error result
    firmwareHashCheckOtherError: 'security.firmware.hashCheck.otherError',
    // Subset of `firmwareHashCheck`: disables timeout result, and also may bear `timeoutThresholdsPerModel` payload, see connectInitThunks
    firmwareHashCheckTimeout: 'security.firmware.hashCheck.timeout',

    // Disables wallet-creation entropy check UI, making it silent on Desktop/Web.
    entropyCheck: 'security.entropyCheck',
    // Like `entropyCheck` for Mobile. DO NOT separate flags per platform, rather use conditions in the message. Kept here for compatibility.
    entropyCheckMobile: 'security.entropyCheck.mobile',
    // Disables discovery entropy check UI, making it silent.
    entropyCheckDiscovery: 'security.entropyCheck.discovery',

    // Disables UI for Optiga proof result on Device Authenticity Check.
    deviceAuthenticityCheckOptiga: 'security.deviceAuthenticityCheck.optiga',
    // Disables UI for Tropic proof result on Device Authenticity Check.
    deviceAuthenticityCheckTropic: 'security.deviceAuthenticityCheck.tropic',
    // Disables UI for MCU proof result on Device Authenticity Check.
    deviceAuthenticityCheckMCU: 'security.deviceAuthenticityCheck.mcu',

    // Disables id check UI (one of the meta checks), making it silent.
    idCheck: 'security.deviceMetaChecks.id',
    // Disables invariability check UI (one of the meta checks), making it silent.
    invariabilityCheck: 'security.deviceMetaChecks.invariability',

    trading: {
        buy: 'trading.buy',
        sell: 'trading.sell',
        exchange: 'trading.exchange',
        restrictions: {
            blacklist: 'trading.restrictions.blacklist',
            residenceWhitelistRequired: 'trading.restrictions.residenceWhitelistRequired',
        },
        concierge: 'trading.concierge',
        survey: 'trading.survey',
        slip24: 'trading.slip24',
        txSimulation: 'trading.txSimulation',
    },
    earn: {
        dashboard: {
            staking: 'earn.dashboard.staking',
            yield: 'earn.dashboard.yield',
        } as const satisfies Record<EarnDashboardType, string>,
        yield: {
            deposit: 'earn.yield.deposit',
            withdraw: 'earn.yield.withdraw',
            claim: 'earn.yield.claim',
        } as const satisfies Record<YieldFlowType, string>,
        // Wrapping the native coin into its wrapped-native token (e.g. ETH → WETH) and back. It is
        // a step of the yield deposit/withdraw flows, but also a standalone flow, so it is gated
        // separately from the yield flow types.
        wrappedNative: {
            wrap: 'earn.wrappedNative.wrap',
            unwrap: 'earn.wrappedNative.unwrap',
        } as const satisfies Record<WrappedNativeFlowType, string>,
    },
    finprom: {
        presenceRestriction: 'finprom.presenceRestriction',
    },
    mevProtection: 'settings.mevProtection',
    suiteSync: 'settings.suiteSync',

    // Feature flags implemented only for mobile app
    firmwareUpdate: 'device.firmware.update',
    inAppRating: 'inAppRating',
    demoAccountQuestionnaire: 'demoAccountQuestionnaire',
    activityCenter: 'activityCenter',
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

const getWrappedNativeContext = (type: WrappedNativeFlowType) =>
    `earn.wrappedNative.${type}` as const;

export type SettingsCategory = 'general' | 'device' | 'networks' | 'debug';
const getSettingsContext = (category: SettingsCategory) => `settings.${category}` as const;

type LegalContextKey = 'gateway';
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
 * - `getEarnYield('deposit')` → 'earn.yield.deposit'
 * - `getEarnYield('claim')` → 'earn.yield.claim'
 * - `getWrappedNative('wrap')` → 'earn.wrappedNative.wrap'
 * - `getSettings('device')` → 'settings.device'

 */
export const Context = {
    getGeneral: getGeneralContext,
    getAccount: getAccountContext,
    getStaking: getStakingContext,
    getTrading: getTradingContext,
    getEarnDashboard: getEarnDashboardContext,
    getEarnYield: getEarnYieldContext,
    getWrappedNative: getWrappedNativeContext,
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
    assetFirstHomeTable = 'da21537c-d393-4292-9908-cba1eabdb651',
    tradingFeedbackForm = '092db279-98dc-418e-bbfa-ef70716fb211',
    tradingFiatValues = 'b73df44d-37ed-4b66-aba1-5c4164493bae',
    tradingShowTradeFee = 'eef0ff6f-95da-4a7e-aae6-ccd589c32998',
}

export type ExperimentsItemType = Omit<ExperimentsItem, 'id'> & { id: ExperimentId };
