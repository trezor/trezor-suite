import { Translation } from '@suite/intl';
import {
    getTronPendingUnstakeBalance,
    getTronPendingUnstakingBatches,
    selectTronUnstakingBatchesByAccountKey,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    Card,
    Collapsible,
    Column,
    Divider,
    type Padding,
    Row,
    Table,
    Text,
} from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount } from '#src/components/suite';
import { useSelector } from '#src/hooks/suite';

import { TronUnstakingRow } from './TronUnstakingRow';

const HUG_CONTENT_COL_WIDTH = { width: '1%' };
const COL_WIDTHS = [{}, HUG_CONTENT_COL_WIDTH];
const HEADER_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type TronUnstakingCardProps = {
    account: Account;
    nowSeconds: number;
};

export const TronUnstakingCard = ({ account, nowSeconds }: TronUnstakingCardProps) => {
    const batches = useSelector(state =>
        selectTronUnstakingBatchesByAccountKey(state, account.key),
    );

    const pendingBatches = getTronPendingUnstakingBatches({
        batches,
        symbol: account.symbol,
        nowSeconds,
    });

    if (pendingBatches.length === 0) return null;

    const pendingBalance = getTronPendingUnstakeBalance(account, nowSeconds);

    return (
        <Card paddingType="none" data-testid="@staking/tron-unstaking-card/container">
            <Collapsible>
                <Collapsible.Toggle>
                    <Row
                        data-testid="@staking/tron-unstaking-card/toggle"
                        justifyContent="space-between"
                        alignItems="center"
                        padding={HEADER_PADDING}
                    >
                        <Text typographyStyle="body-sm-strong">
                            <Translation id="TR_EARN_TRON_UNSTAKING_TITLE" />
                        </Text>
                        <Row gap={16} alignItems="center">
                            <Column gap={2} alignItems="flex-end">
                                <Text
                                    typographyStyle="body-md-strong"
                                    data-testid="@staking/tron-unstaking-card/amount"
                                >
                                    <FormattedCryptoAmount
                                        value={pendingBalance}
                                        symbol={account.symbol}
                                    />
                                </Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <BaseCurrencyValue
                                        amount={pendingBalance}
                                        symbol={account.symbol}
                                        showApproximationIndicator
                                    />
                                </Text>
                            </Column>
                            <Collapsible.ToggleIcon size={20} />
                        </Row>
                    </Row>
                </Collapsible.Toggle>

                <Collapsible.Content>
                    <Divider margin={{}} color="elementBorderNeutralSofter" />
                    <Table colWidths={COL_WIDTHS} typographyStyle="body-sm">
                        <Table.Body>
                            {pendingBatches.map(({ amount, expireTime }, index) => (
                                <TronUnstakingRow
                                    key={`${expireTime}-${index}`}
                                    index={index}
                                    amount={amount}
                                    expireTime={expireTime}
                                    symbol={account.symbol}
                                />
                            ))}
                        </Table.Body>
                    </Table>
                </Collapsible.Content>
            </Collapsible>
        </Card>
    );
};
