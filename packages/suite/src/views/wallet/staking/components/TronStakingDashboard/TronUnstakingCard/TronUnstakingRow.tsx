import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TronResourceType } from '@suite-common/wallet-types';
import { Column, type Padding, Table, Text } from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

const RESOURCE_LABELS: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_TRON_BANDWIDTH',
    energy: 'TR_TRON_ENERGY',
};

const TITLE_CELL_PADDING = { vertical: 12, left: 20, right: 8 } satisfies Padding;
const LOCKED_CELL_PADDING = { vertical: 12, left: 8, right: 20 } satisfies Padding;
const AMOUNT_CELL_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type TronUnstakingRowProps = {
    index: number;
    amount: string;
    daysLocked: number;
    resource: TronResourceType | undefined;
    symbol: NetworkSymbol;
};

export const TronUnstakingRow = ({
    index,
    amount,
    daysLocked,
    resource,
    symbol,
}: TronUnstakingRowProps) => {
    const testIdPrefix = `@staking/tron-unstaking-card/row-${index}`;

    return (
        <Table.Row data-testid={testIdPrefix}>
            <Table.Cell padding={TITLE_CELL_PADDING}>
                {index === 0 && (
                    <Text typographyStyle="body-sm-strong" textWrap="nowrap">
                        <Translation id="TR_EARN_TRON_UNSTAKING" />
                    </Text>
                )}
            </Table.Cell>

            <Table.Cell padding={LOCKED_CELL_PADDING}>
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    textWrap="nowrap"
                    data-testid={`${testIdPrefix}/locked`}
                >
                    <Translation
                        id="TR_EARN_TRON_UNSTAKING_DAYS_LOCKED"
                        values={{ days: daysLocked }}
                    />
                </Text>
            </Table.Cell>

            <Table.Cell align="end" padding={AMOUNT_CELL_PADDING}>
                <Column alignItems="flex-end">
                    <Text typographyStyle="body-md-strong" data-testid={`${testIdPrefix}/amount`}>
                        <FormattedCryptoAmount value={amount} symbol={symbol} />
                    </Text>

                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        data-testid={`${testIdPrefix}/resource`}
                    >
                        {resource ? (
                            <Translation id={RESOURCE_LABELS[resource]} />
                        ) : (
                            <BaseCurrencyValue
                                amount={amount}
                                symbol={symbol}
                                showApproximationIndicator
                            />
                        )}
                    </Text>
                </Column>
            </Table.Cell>
        </Table.Row>
    );
};
