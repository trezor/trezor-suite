import { formatStakingAmount } from '@suite-common/earn-staking';
import { type StakingPositionTarget } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Table } from '@trezor/components';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

interface TronVoteAllocationRowProps {
    target: StakingPositionTarget;
    rate: number | null;
    symbol: NetworkSymbol;
}

export const TronVoteAllocationRow = ({ target, rate, symbol }: TronVoteAllocationRowProps) => {
    const formatApyValue = useFormatApy();

    return (
        <Table.Row data-testid={`@modal/tron-vote-allocation/row/${target.address}`}>
            <Table.Cell data-testid="@modal/tron-vote-allocation/row-name">
                {target.name ?? target.address}
            </Table.Cell>

            <Table.Cell data-testid="@modal/tron-vote-allocation/row-votes">
                {formatStakingAmount({ amount: target.amount, networkSymbol: symbol })}
            </Table.Cell>

            <Table.Cell data-testid="@modal/tron-vote-allocation/row-apr">
                {formatApyValue(rate, { withSymbol: true })}
            </Table.Cell>
        </Table.Row>
    );
};
