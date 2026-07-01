import { type TrxStats } from '@suite-common/earn-staking-api';
import { type TronVote } from '@trezor/blockchain-link-types';
import { Table } from '@trezor/components';

import { formatApr } from 'src/components/earn/staking/tron/voteUtils';

interface TronVoteAllocationRowProps {
    vote: TronVote;
    representatives: TrxStats | undefined;
}

export const TronVoteAllocationRow = ({ vote, representatives }: TronVoteAllocationRowProps) => {
    const representative = representatives?.find(({ address }) => address === vote.address);

    return (
        <Table.Row>
            <Table.Cell>{representative?.name ?? vote.address}</Table.Cell>
            <Table.Cell>{vote.voteCount}</Table.Cell>
            <Table.Cell>{formatApr(representative?.apr)}</Table.Cell>
        </Table.Row>
    );
};
