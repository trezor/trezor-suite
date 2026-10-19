import {
    getTronPendingUnstakingBatches,
    selectTronUnstakingBatchesByAccountKey,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { TronUnstakingRow } from './TronUnstakingRow';

const HUG_CONTENT_COL_WIDTH = { width: '1%' };
const COL_WIDTHS = [HUG_CONTENT_COL_WIDTH, HUG_CONTENT_COL_WIDTH, {}];

type TronUnstakingCardProps = {
    account: Account;
};

export const TronUnstakingCard = ({ account }: TronUnstakingCardProps) => {
    const batches = useSelector(state =>
        selectTronUnstakingBatchesByAccountKey(state, account.key),
    );

    const pendingBatches = getTronPendingUnstakingBatches({ batches, symbol: account.symbol });

    if (pendingBatches.length === 0) return null;

    return (
        <Card paddingType="none" data-testid="@staking/tron-unstaking-card/container">
            <Table colWidths={COL_WIDTHS} typographyStyle="body-sm">
                <Table.Body>
                    {pendingBatches.map(({ amount, daysLocked, resource }, index) => (
                        <TronUnstakingRow
                            key={`${resource ?? 'unknown'}-${daysLocked}-${index}`}
                            index={index}
                            amount={amount}
                            daysLocked={daysLocked}
                            resource={resource}
                            symbol={account.symbol}
                        />
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
};
