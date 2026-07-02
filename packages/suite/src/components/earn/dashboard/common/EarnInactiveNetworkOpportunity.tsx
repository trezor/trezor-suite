import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, Column, Paragraph, Row, Table } from '@trezor/components';

import { EarnAccountCell } from './EarnAccountCell';
import { EarnActivateButton } from './EarnActivateButton';
import { EarnStakingApyTooltip } from '../staking/EarnStakingApyTooltip';

type EarnInactiveNetworkOpportunityProps = {
    symbol: NetworkSymbol;
    apy: number | null;
    note?: ReactNode;
    isCardLayout: boolean;
};

export const EarnInactiveNetworkOpportunity = ({
    symbol,
    apy,
    note,
    isCardLayout,
}: EarnInactiveNetworkOpportunityProps) => {
    const noteParagraph = note && (
        <Paragraph typographyStyle="body-md" intent="neutral">
            {note}
        </Paragraph>
    );

    if (isCardLayout) {
        return (
            <Card paddingType="small">
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        <EarnAccountCell symbol={symbol} />

                        <EarnStakingApyTooltip symbol={symbol} apy={apy} />
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
                <EarnStakingApyTooltip symbol={symbol} apy={apy} />
            </Table.Cell>

            <Table.Cell colSpan={2}>{noteParagraph}</Table.Cell>

            <Table.Cell align="end">
                <EarnActivateButton symbol={symbol} />
            </Table.Cell>
        </Table.Row>
    );
};
