import { type TrxStats } from '@suite-common/earn-staking-api';
import { type TronVote } from '@trezor/blockchain-link-types';
import { Table } from '@trezor/components';

import { useFormatApyValue } from 'src/components/earn/utils/earnApyUtils';

interface TronVoteAllocationRowProps {
    vote: TronVote;
    representatives: TrxStats | undefined;
}

export const TronVoteAllocationRow = ({ vote, representatives }: TronVoteAllocationRowProps) => {
    const formatApyValue = useFormatApyValue();
    const representative = representatives?.find(({ address }) => address === vote.address);

    return (
        <Table.Row data-testid={`@modal/tron-vote-allocation/row/${vote.address}`}>
            <Table.Cell data-testid="@modal/tron-vote-allocation/row-name">
                {representative?.name ?? vote.address}
            </Table.Cell>
            <Table.Cell data-testid="@modal/tron-vote-allocation/row-votes">
                {vote.voteCount}
            </Table.Cell>
            <Table.Cell data-testid="@modal/tron-vote-allocation/row-apr">
                {formatApyValue(representative?.apr, { withSymbol: true })}
            </Table.Cell>
        </Table.Row>
    );
};
