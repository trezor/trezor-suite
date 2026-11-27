import { type ReactNode } from 'react';

import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, Column, Paragraph, Row, Table } from '@trezor/components';

import { EarnAccountCell } from './EarnAccountCell';
import { EarnActivateButton } from './EarnActivateButton';
import { EarnStakingRateTooltip } from '../staking/EarnStakingRateTooltip';

type EarnInactiveNetworkOpportunityProps = {
    symbol: NetworkSymbol;
    rate: number | null;
    rateKind: StakingRateKind | null;
    note?: ReactNode;
    isCardLayout: boolean;
};

export const EarnInactiveNetworkOpportunity = ({
    symbol,
    rate,
    rateKind,
    note,
    isCardLayout,
}: EarnInactiveNetworkOpportunityProps) => {
    const noteParagraph = note && (
        <Paragraph typographyStyle="body-sm" intent="neutral">
            {note}
        </Paragraph>
    );

    const rowTestId = `@earn/dashboard/activate-row/${symbol}`;

    if (isCardLayout) {
        return (
            <Card paddingType="small" data-testid={rowTestId}>
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        <EarnAccountCell symbol={symbol} />

                        <EarnStakingRateTooltip
                            networkSymbol={symbol}
                            rateKind={rateKind}
                            rate={rate}
                        />
                    </Row>

                    {noteParagraph}

                    <Row>
                        <EarnActivateButton symbol={symbol} />
                    </Row>
                </Column>
            </Card>
        );
    }

    return (
        <Table.Row data-testid={rowTestId}>
            <Table.Cell>
                <EarnAccountCell symbol={symbol} />
            </Table.Cell>

            <Table.Cell>
                <EarnStakingRateTooltip networkSymbol={symbol} rateKind={rateKind} rate={rate} />
            </Table.Cell>

            <Table.Cell colSpan={2}>{noteParagraph}</Table.Cell>

            <Table.Cell align="end">
                <EarnActivateButton symbol={symbol} />
            </Table.Cell>
        </Table.Row>
    );
};
