import { Translation } from '@suite/intl';
import { Paragraph, Row, Spinner, Table } from '@trezor/components';

import { EarnYieldAccountOpportunity } from './EarnYieldAccountOpportunity';
import { type YieldAccountOpportunity, type YieldNetworkNotActivated } from './types';
import { EarnInactiveNetworkOpportunity } from '../common/EarnInactiveNetworkOpportunity';

type EarnYieldTableBodyProps = {
    isYieldOpportunitiesLoading: boolean;
    yieldAccountOpportunities: YieldAccountOpportunity[];
    yieldNetworksNotActivated: YieldNetworkNotActivated[];
};

export const EarnYieldTableBody = ({
    isYieldOpportunitiesLoading,
    yieldAccountOpportunities,
    yieldNetworksNotActivated,
}: EarnYieldTableBodyProps) => {
    if (isYieldOpportunitiesLoading) {
        return (
            <Table.Body>
                <Table.Row>
                    <Table.Cell colSpan={5}>
                        <Row width="100%" justifyContent="center" padding={{ vertical: 16 }}>
                            <Spinner size={24} />
                        </Row>
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        );
    }

    if (yieldAccountOpportunities.length === 0 && yieldNetworksNotActivated.length === 0) {
        return (
            <Table.Body>
                <Table.Row>
                    <Table.Cell colSpan={5}>
                        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
                        </Paragraph>
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        );
    }

    return (
        <Table.Body>
            {yieldAccountOpportunities.map(opportunity => (
                <EarnYieldAccountOpportunity key={opportunity.key} opportunity={opportunity} />
            ))}

            {yieldNetworksNotActivated.map(network => (
                <EarnInactiveNetworkOpportunity
                    key={network.symbol}
                    symbol={network.symbol}
                    apy={network.apyPercentage}
                />
            ))}
        </Table.Body>
    );
};
