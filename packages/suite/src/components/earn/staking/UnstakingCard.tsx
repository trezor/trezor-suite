import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    Box,
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
import { CountdownTimer } from '#src/components/suite/CountdownTimer';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

const COL_WIDTHS = [{}, { width: '1%' }];
const PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type UnstakingRow = {
    testId: string;
    amount: string;
    availableAt: number | null;
    label?: ReactNode;
    unknownTimeId?: TranslationKey;
};

type UnstakingCardProps = {
    symbol: NetworkSymbol;
    amount: string;
    rows: readonly UnstakingRow[];
    isCompactAmount?: boolean;
    testId: string;
};

type UnstakingAmountProps = {
    symbol: NetworkSymbol;
    amount: string;
    isCompact?: boolean;
    testId: string;
};

const UnstakingAmount = ({ symbol, amount, isCompact, testId }: UnstakingAmountProps) => (
    <Column gap={2} alignItems="flex-end">
        <Text typographyStyle="body-md-strong" align="end" textWrap="nowrap" data-testid={testId}>
            <FormattedCryptoAmount value={amount} networkSymbol={symbol} isCompact={isCompact} />
        </Text>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary" textWrap="nowrap">
            <BaseCurrencyValue amount={amount} symbol={symbol} showApproximationIndicator />
        </Text>
    </Column>
);

export const UnstakingCard = ({
    symbol,
    amount,
    rows,
    isCompactAmount,
    testId,
}: UnstakingCardProps) => {
    const content = (
        <Box width="100%" data-testid={`${testId}/container`}>
            <Collapsible>
                <Collapsible.Toggle>
                    <Row
                        data-testid={`${testId}/toggle`}
                        justifyContent="space-between"
                        alignItems="center"
                        padding={PADDING}
                    >
                        <Text typographyStyle="body-sm-strong">
                            <Translation id="TR_STAKE_UNSTAKING" />
                        </Text>
                        <Row gap={16} alignItems="center">
                            <UnstakingAmount
                                symbol={symbol}
                                amount={amount}
                                isCompact={isCompactAmount}
                                testId={`${testId}/amount`}
                            />
                            <Collapsible.ToggleIcon size={20} />
                        </Row>
                    </Row>
                </Collapsible.Toggle>

                <Collapsible.Content>
                    <Divider margin={{}} color="elementBorderNeutralSofter" />
                    <Table colWidths={COL_WIDTHS} typographyStyle="body-sm">
                        <Table.Body>
                            {rows.map(row => (
                                <Table.Row key={row.testId} data-testid={row.testId}>
                                    <Table.Cell padding={PADDING}>
                                        <Column gap={4}>
                                            {row.label}
                                            {(row.availableAt !== null || row.unknownTimeId) && (
                                                <Text
                                                    typographyStyle="body-sm"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    data-testid={`${row.testId}/time-left`}
                                                >
                                                    {row.availableAt === null ? (
                                                        row.unknownTimeId && (
                                                            <Translation id={row.unknownTimeId} />
                                                        )
                                                    ) : (
                                                        <CountdownTimer
                                                            deadline={row.availableAt}
                                                            message="TR_EARN_TRON_UNSTAKING_READY_IN"
                                                            pastDeadlineMessage={row.unknownTimeId}
                                                            minUnit="hour"
                                                            minUnitValue={1}
                                                            unitDisplay="long"
                                                            isApproximate
                                                        />
                                                    )}
                                                </Text>
                                            )}
                                        </Column>
                                    </Table.Cell>

                                    <Table.Cell align="end" padding={PADDING}>
                                        <UnstakingAmount
                                            symbol={symbol}
                                            amount={row.amount}
                                            isCompact={isCompactAmount}
                                            testId={`${row.testId}/amount`}
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Collapsible.Content>
            </Collapsible>
        </Box>
    );

    return <Card paddingType="none">{content}</Card>;
};
