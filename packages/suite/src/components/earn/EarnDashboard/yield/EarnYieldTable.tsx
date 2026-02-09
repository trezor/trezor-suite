import { Translation } from '@suite/intl';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Paragraph, Row, Table } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { EarnAccountCell } from '../common/EarnAccountCell';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';

export const EarnYieldTable = () => {
    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const ethereumAccounts = visibleAccounts.filter(account => account.symbol === 'eth');
    const isYieldActive = ethereumAccounts.some(account =>
        new BigNumber(account.formattedBalance).gt(0),
    );

    const badge = getEarnDashboardBadgeState({
        isSectionActive: isYieldActive,
        activeLabelId: 'TR_EARN_DASHBOARD_ACTIVE',
        notActiveLabelId: 'TR_EARN_DASHBOARD_NOT_ACTIVE',
    });

    return (
        <EarnDashboardSection
            titleId="TR_EARN_YIELD_DASHBOARD_TITLE"
            subheadingId="TR_EARN_YIELD_DASHBOARD_TEXT"
            provider="morpho"
            statusBadge={badge}
        >
            <Card paddingType="none">
                <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                    <EarnDashboardTableHeader />

                    <Table.Body>
                        {ethereumAccounts.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={5}>
                                    <Paragraph typographyStyle="body" variant="tertiary">
                                        <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
                                    </Paragraph>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            ethereumAccounts.map(account => {
                                const hasBalance = new BigNumber(account.formattedBalance).gt(0);

                                return (
                                    <Table.Row key={account.key}>
                                        <Table.Cell>
                                            <EarnAccountCell account={account} />
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Paragraph typographyStyle="body" variant="tertiary">
                                                <Translation id="TR_EARN_NOT_AVAILABLE" />
                                            </Paragraph>
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Paragraph typographyStyle="body" variant="tertiary">
                                                <Translation id="TR_EARN_NOT_AVAILABLE" />
                                            </Paragraph>
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Paragraph typographyStyle="body" variant="tertiary">
                                                <Translation id="TR_EARN_NOT_AVAILABLE" />
                                            </Paragraph>
                                        </Table.Cell>

                                        <Table.Cell align="end">
                                            <Row justifyContent="flex-end" gap={8}>
                                                {hasBalance ? (
                                                    <>
                                                        <Button size="small">
                                                            <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_MORE" />
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            intent="brand"
                                                            priority="secondary"
                                                        >
                                                            <Translation id="TR_EARN_YIELD_DASHBOARD_WITHDRAW" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button size="small">
                                                        <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_NOW" />
                                                    </Button>
                                                )}
                                            </Row>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table>
            </Card>
        </EarnDashboardSection>
    );
};
