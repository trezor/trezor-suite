import { type ReactNode } from 'react';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { Card, Column, Paragraph, Row, Table } from '@trezor/components';

import { EarnAccountCell } from './EarnAccountCell';
import { EarnActivateButton } from './EarnActivateButton';
import { EarnStakingRateTooltip } from '../staking/EarnStakingRateTooltip';

type EarnInactiveNetworkOpportunityProps = {
    symbol: NetworkSymbol;
    rate: number | null;
    note?: ReactNode;
    isCardLayout: boolean;
};

export const EarnInactiveNetworkOpportunity = ({
    symbol,
    rate,
    note,
    isCardLayout,
}: EarnInactiveNetworkOpportunityProps) => {
    const networkType = getNetworkType(symbol);

    const noteParagraph = note && (
        <Paragraph typographyStyle="body-sm" intent="neutral">
            {note}
        </Paragraph>
    );

    if (isCardLayout) {
        return (
            <Card paddingType="small">
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        <EarnAccountCell symbol={symbol} />

                        <EarnStakingRateTooltip networkType={networkType} rate={rate} />
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
        <Table.Row>
            <Table.Cell>
                <EarnAccountCell symbol={symbol} />
            </Table.Cell>

            <Table.Cell>
                <EarnStakingRateTooltip networkType={networkType} rate={rate} />
            </Table.Cell>

            <Table.Cell colSpan={2}>{noteParagraph}</Table.Cell>

            <Table.Cell align="end">
                <EarnActivateButton symbol={symbol} />
            </Table.Cell>
        </Table.Row>
    );
};
