import { useWatch } from 'react-hook-form';

import { getTotalVotes } from '@suite-common/wallet-core';
import { Translation } from '@suite-lego/intl';
import { Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { getRemainingVotes } from '../utils/voteUtils';

export const TronVoteRemainingVotes = () => {
    const { account, form } = useTronStakeContext();

    const allocations = useWatch({ control: form.methods.control, name: 'voteAllocations' });

    const totalVotes = getTotalVotes(account);
    const remainingVotes = Math.max(getRemainingVotes({ totalVotes, allocations }), 0);

    return (
        <Text
            typographyStyle="body-md"
            intent="neutral"
            priority="secondary"
            data-testid="@staking/tron-vote/remaining-votes"
        >
            <Translation
                id="TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL"
                values={{ remaining: remainingVotes, total: totalVotes }}
            />
        </Text>
    );
};
