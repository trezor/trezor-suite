import { ExperimentsItem, MessageSystem, Category } from '@suite-common/suite-types';

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

export const Feature = {
    coinjoin: 'coinjoin',
    killswitch: 'killswitch',
    ethStake: 'eth.staking.stake',
    ethUnstake: 'eth.staking.unstake',
    ethClaim: 'eth.staking.claim',
    firmwareRevisionCheck: 'security.firmware.check',
    firmwareHashCheck: 'security.firmware.hashCheck',
} as const;

export type FeatureDomain = (typeof Feature)[keyof typeof Feature];

export const Context = {
    coinjoin: 'accounts.coinjoin',
    ethStaking: 'accounts.eth.staking',
} as const;

export type ContextDomain = (typeof Context)[keyof typeof Context];

export const Experiment = {
    // e.g. orangeSendButton: 'fb0eb1bc-8ec3-44d4-98eb-53301d73d981',
} as const;

export type ExperimentId = (typeof Experiment)[keyof typeof Experiment];

export type ExperimentsItemType = Omit<ExperimentsItem, 'id'> & { id: ExperimentId };
