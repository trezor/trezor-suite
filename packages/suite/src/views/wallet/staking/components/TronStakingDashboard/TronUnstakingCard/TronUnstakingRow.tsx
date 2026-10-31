import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, type Padding, Table, Text } from '@trezor/components';

import { BaseCurrencyValue, CountdownTimer, FormattedCryptoAmount } from 'src/components/suite';

const CELL_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type TronUnstakingRowProps = {
    index: number;
    amount: string;
    expireTime: number;
    symbol: NetworkSymbol;
};

export const TronUnstakingRow = ({ index, amount, expireTime, symbol }: TronUnstakingRowProps) => {
    const testIdPrefix = `@staking/tron-unstaking-card/row-${index}`;

    return (
        <Table.Row data-testid={testIdPrefix}>
            <Table.Cell padding={CELL_PADDING}>
                <Column alignItems="flex-start">
                    <Text typographyStyle="body-md-strong" data-testid={`${testIdPrefix}/amount`}>
                        <FormattedCryptoAmount value={amount} symbol={symbol} />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <BaseCurrencyValue
                            amount={amount}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    </Text>
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={CELL_PADDING}>
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    textWrap="nowrap"
                    data-testid={`${testIdPrefix}/time-left`}
                >
                    <CountdownTimer
                        deadline={expireTime * 1000}
                        message="TR_EARN_TRON_UNSTAKING_READY_IN"
                        minUnit="hour"
                        minUnitValue={1}
                        unitDisplay="long"
                        isApproximate
                    />
                </Text>
            </Table.Cell>
        </Table.Row>
    );
};
