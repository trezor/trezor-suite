import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { getTotalVotes } from '@suite-common/wallet-core';
import { Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { getRemainingVotes } from '../utils/voteUtils';

export const TronVoteRemainingVotes = () => {
    const { account, form } = useTronStakeContext();

    const allocations = useWatch({ control: form.methods.control, name: 'voteAllocations' });

    const totalVotes = getTotalVotes(account);
    const remainingVotes = Math.max(getRemainingVotes({ totalVotes, allocations }), 0);

    return (
        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
            <Translation
                id="TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL"
                values={{ remaining: remainingVotes, total: totalVotes }}
            />
        </Text>
    );
};
