import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { useSeededCardanoVotingDelegation } from 'src/hooks/earn/useCardanoAccountVotingDelegation';

import {
    BASE_VOTING_PREFERENCE_OPTIONS,
    VotingPreferenceCard,
    type VotingPreferenceOption,
} from './VotingPreferenceCard';

const VOTING_PREFERENCE_OPTIONS: VotingPreferenceOption[] = BASE_VOTING_PREFERENCE_OPTIONS.map(
    option =>
        option.type === 'abstain'
            ? { ...option, badge: { label: 'TR_DEFAULT', intent: 'brand' } }
            : option,
);

const KEEP_CURRENT_OPTION: VotingPreferenceOption = {
    type: 'current',
    label: 'TR_STAKING_KEEP_CURRENT_DELEGATION',
};

type CardanoVotingPreferenceProps = {
    account: Account;
};

export const CardanoVotingPreference = ({ account }: CardanoVotingPreferenceProps) => {
    const accountVotingDelegation = useSeededCardanoVotingDelegation(account);

    if (account.networkType !== 'cardano') return null;

    const options = accountVotingDelegation
        ? [KEEP_CURRENT_OPTION, ...VOTING_PREFERENCE_OPTIONS]
        : VOTING_PREFERENCE_OPTIONS;

    return (
        <VotingPreferenceCard
            account={account}
            heading={
                <Translation
                    id="TR_STAKING_WHO_VOTES_WITH_YOUR_FUNDS"
                    values={{ displaySymbol: getNetworkDisplaySymbol(account.symbol) }}
                />
            }
            description={<Translation id="TR_STAKING_VOTING_PREFERENCE_DESCRIPTION" />}
            options={options}
        />
    );
};
