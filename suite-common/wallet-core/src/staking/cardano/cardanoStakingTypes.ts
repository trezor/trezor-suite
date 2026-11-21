import { type AccountKey } from '@suite-common/wallet-types';

export type VotingDelegationOption =
    | { type: 'abstain' }
    | { type: 'no_confidence' }
    | { type: 'everstake' }
    | { type: 'another_drep'; drepId: string }
    | { type: 'current' };

export type AccountVotingDelegation = {
    accountKey: AccountKey;
    option: VotingDelegationOption;
};
