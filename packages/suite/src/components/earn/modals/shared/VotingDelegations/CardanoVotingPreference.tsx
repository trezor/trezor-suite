import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSeededCardanoVotingDelegation } from 'src/hooks/earn/useCardanoAccountVotingDelegation';

import {
    BASE_VOTING_PREFERENCE_OPTIONS,
    VotingPreferenceCard,
    type VotingPreferenceOption,
} from './VotingPreferenceCard';

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

    const defaultType =
        accountVotingDelegation && !isCardanoStakedWithFiveBinaries(account)
            ? 'current'
            : 'abstain';
    const availableOptions = accountVotingDelegation
        ? [KEEP_CURRENT_OPTION, ...BASE_VOTING_PREFERENCE_OPTIONS]
        : BASE_VOTING_PREFERENCE_OPTIONS;
    const options: VotingPreferenceOption[] = availableOptions.map(option =>
        option.type === defaultType
            ? { ...option, badge: { label: 'TR_DEFAULT', intent: 'brand' } }
            : option,
    );

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
