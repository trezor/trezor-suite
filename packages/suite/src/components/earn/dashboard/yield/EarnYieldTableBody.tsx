import { Translation } from '@suite/intl';
import { Paragraph, Row, Spinner, Table } from '@trezor/components';

import { EarnYieldAccountOpportunity } from './EarnYieldAccountOpportunity';
import { EarnYieldInactiveVaultOpportunity } from './EarnYieldInactiveVaultOpportunity';
import { type YieldAccountOpportunity, type YieldInactiveVaultOpportunity } from './types';

type EarnYieldTableBodyProps = {
    isYieldOpportunitiesLoading: boolean;
    yieldAccountOpportunities: YieldAccountOpportunity[];
    yieldInactiveVaultOpportunities: YieldInactiveVaultOpportunity[];
};

export const EarnYieldTableBody = ({
    isYieldOpportunitiesLoading,
    yieldAccountOpportunities,
    yieldInactiveVaultOpportunities,
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

    if (yieldAccountOpportunities.length === 0 && yieldInactiveVaultOpportunities.length === 0) {
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

            {yieldInactiveVaultOpportunities.map(opportunity => (
                <EarnYieldInactiveVaultOpportunity
                    key={opportunity.key}
                    opportunity={opportunity}
                />
            ))}
        </Table.Body>
    );
};
