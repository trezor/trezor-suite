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
        <Table.Row>
            <Table.Cell>{representative?.name ?? vote.address}</Table.Cell>
            <Table.Cell>{vote.voteCount}</Table.Cell>
            <Table.Cell>{formatApyValue(representative?.apr, { withSymbol: true })}</Table.Cell>
        </Table.Row>
    );
};
