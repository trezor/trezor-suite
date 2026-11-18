import { Translation } from '@suite/intl';
import {
    formatStakingAmount,
    selectStakingAccountPositionEntry,
    settleTronUnlocks,
} from '@suite-common/earn-staking';
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

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

import { TronUnstakingRow } from './TronUnstakingRow';

const HUG_CONTENT_COL_WIDTH = { width: '1%' };
const COL_WIDTHS = [{}, HUG_CONTENT_COL_WIDTH];
const HEADER_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type TronUnstakingCardProps = {
    account: Account;
    nowMs: number;
};

export const TronUnstakingCard = ({ account, nowMs }: TronUnstakingCardProps) => {
    const position = useSelector(
        state => selectStakingAccountPositionEntry(state, account.key)?.position ?? null,
    );

    if (position === null) return null;

    const { unlocks, unstaking } = settleTronUnlocks({ position, nowMs });

    if (unlocks.length === 0) return null;

    const pendingBalance = formatStakingAmount({
        amount: unstaking,
        networkSymbol: account.symbol,
    });

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
                                        networkSymbol={account.symbol}
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
                            {unlocks.map(({ amount, availableAt }, index) => (
                                <TronUnstakingRow
                                    key={`${availableAt}-${index}`}
                                    index={index}
                                    amount={formatStakingAmount({
                                        amount,
                                        networkSymbol: account.symbol,
                                    })}
                                    availableAt={availableAt}
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
