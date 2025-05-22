import { Category, ExperimentsItem, MessageSystem } from '@suite-common/suite-types';

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
    deviceOnboardingMobile: 'device.onboarding.mobile', // for all device models (including T2T1)
    deviceOnboardingMobileT2T1: 'device.onboarding.T2T1.mobile', // specifically for T2T1 devices
} as const;

type ExtractFeatureValues<T> =
    T extends Record<string, infer U>
        ? U extends Record<string, any>
            ? ExtractFeatureValues<U>
            : U
        : never;

export type FeatureDomain = ExtractFeatureValues<typeof Feature>;

export const Context = {
    coinjoin: 'accounts.coinjoin',
    ethStaking: 'accounts.eth.staking',
    solStaking: 'accounts.sol.staking',
    tradingBuy: 'trading.buy',
    tradingSell: 'trading.sell',
    tradingExchange: 'trading.exchange',
} as const;

export type ContextDomain = (typeof Context)[keyof typeof Context];

export const Experiment = {
    // e.g. orangeSendButton: 'fb0eb1bc-8ec3-44d4-98eb-53301d73d981',
} as const;

export type ExperimentId = (typeof Experiment)[keyof typeof Experiment];

export type ExperimentsItemType = Omit<ExperimentsItem, 'id'> & { id: ExperimentId };
