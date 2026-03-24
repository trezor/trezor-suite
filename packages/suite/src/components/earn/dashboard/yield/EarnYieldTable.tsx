import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-api';
import { NORMAL_ACCOUNT_TYPE } from '@suite-common/wallet-config';
import {
    selectDeviceSupportedNetworks,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Button, Card, Column, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { EarnYieldTableBody } from './EarnYieldTableBody';
import { useAllYieldOpportunities } from './hooks/useAllYieldOpportunities';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';

const isYieldOpportunityAvailable = (vault: YieldDto) =>
    !vault.metadata.underMaintenance && !vault.metadata.deprecated;

export const EarnYieldTable = () => {
    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const normalAccounts = useMemo(
        () => visibleAccounts.filter(account => account.accountType === NORMAL_ACCOUNT_TYPE),
        [visibleAccounts],
    );
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const { yieldOpportunities, isYieldOpportunitiesLoading } = useAllYieldOpportunities();
    const availableVaults = useMemo(
        () => yieldOpportunities.filter(isYieldOpportunityAvailable),
        [yieldOpportunities],
    );

    const visibleAccountSymbols = useMemo(
        () => new Set(normalAccounts.map(account => account.symbol)),
        [normalAccounts],
    );

    const { yieldAccountOpportunities, yieldInactiveVaultOpportunities, isYieldActive } =
        useYieldTableData({
            availableVaults,
            deviceSupportedNetworkSymbols,
            visibleAccounts: normalAccounts,
            visibleAccountSymbols,
        });

    const {
        displayedYieldAccountOpportunities,
        hasHiddenYieldAccountOpportunities,
        isExpanded,
        toggleIsExpanded,
    } = useYieldAccountsVisibility({ yieldAccountOpportunities });

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
            <Column gap={16} alignItems="center">
                <Card paddingType="none">
                    <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                        <EarnDashboardTableHeader />
                        <EarnYieldTableBody
                            isYieldOpportunitiesLoading={isYieldOpportunitiesLoading}
                            yieldAccountOpportunities={displayedYieldAccountOpportunities}
                            yieldInactiveVaultOpportunities={yieldInactiveVaultOpportunities}
                        />
                    </Table>
                </Card>

                {hasHiddenYieldAccountOpportunities && (
                    <Button intent="neutral" priority="secondary" onClick={toggleIsExpanded}>
                        <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                    </Button>
                )}
            </Column>
        </EarnDashboardSection>
    );
};
