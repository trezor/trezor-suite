import { Card, Column, Row, Table } from '@trezor/components';

import { EarnYieldApyTooltip } from './EarnYieldApyTooltip';
import { type YieldInactiveVaultOpportunity } from './types';
import { EarnAccountCell } from '../common/EarnAccountCell';
import { EarnActivateButton } from '../common/EarnActivateButton';
import { EarnRate } from '../common/EarnRate';

type EarnYieldInactiveVaultOpportunityProps = {
    opportunity: YieldInactiveVaultOpportunity;
    isCardLayout: boolean;
};

export const EarnYieldInactiveVaultOpportunity = ({
    opportunity,
    isCardLayout,
}: EarnYieldInactiveVaultOpportunityProps) => {
    const accountCell = (
        <EarnAccountCell
            symbol={opportunity.networkSymbol}
            iconToken={opportunity.vault.token}
            showAssetNetworkIcon
            subtitle={opportunity.vault.outputToken?.name ?? ''}
        />
    );

    const apyCell = (
        <EarnRate type="apy" rate={opportunity.apyPercentage}>
            <EarnYieldApyTooltip
                vault={opportunity.vault}
                apyPercentage={opportunity.apyPercentage}
                networkSymbol={opportunity.networkSymbol}
            />
        </EarnRate>
    );

    if (isCardLayout) {
        return (
            <Card paddingType="small">
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        {accountCell}
                        {apyCell}
                    </Row>
                    <Row>
                        <EarnActivateButton symbol={opportunity.networkSymbol} />
                    </Row>
                </Column>
            </Card>
        );
    }

    return (
        <Table.Row>
            <Table.Cell>{accountCell}</Table.Cell>

            <Table.Cell>{apyCell}</Table.Cell>

            <Table.Cell colSpan={2} />

            <Table.Cell align="end">
                <EarnActivateButton symbol={opportunity.networkSymbol} />
            </Table.Cell>
        </Table.Row>
    );
};
