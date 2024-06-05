import { MessageSystem, Category } from '@suite-common/suite-types';

export type MessageState = { [key in Category]: boolean };

export type MessageSystemState = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;
    validMessages: { [key in Category]: string[] };
    dismissedMessages: {
        [key: string]: MessageState;
    };
};

export type MessageSystemRootState = {
    messageSystem: MessageSystemState;
};

export const Feature = {
    coinjoin: 'coinjoin',
    killswitch: 'killswitch',
    ethStake: 'eth.staking.stake',
    ethUnstake: 'eth.staking.unstake',
    ethClaim: 'eth.staking.claim',
} as const;

export type FeatureDomain = (typeof Feature)[keyof typeof Feature];

export const Context = {
    coinjoin: 'accounts.coinjoin',
    ethStaking: 'accounts.eth.staking',
} as const;

export type ContextDomain = (typeof Context)[keyof typeof Context];
