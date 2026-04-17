import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { Context } from '@suite-common/message-system';
import { NORMAL_ACCOUNT_TYPE } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Column, Table, Text } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemEarnDashboard } from 'src/hooks/suite/useMessageSystemEarnDashboard';

import { EarnYieldTableBody } from './EarnYieldTableBody';
import { useAllYieldOpportunities } from './hooks/useAllYieldOpportunities';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { EarnFeatureDisabledBanner } from '../common/EarnFeatureDisabledBanner';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';
import { useMerkleRewards } from './hooks/useMerkleRewards';

export const EarnYieldTable = () => {
    const { isDisabled: isYieldDashboardDisabled, content } =
        useMessageSystemEarnDashboard('yield');

    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const visibleAccountSymbols = useMemo(() => {
        const normalAccounts = visibleAccounts.filter(
            account => account.accountType === NORMAL_ACCOUNT_TYPE,
        );

        return new Set(normalAccounts.map(account => account.symbol));
    }, [visibleAccounts]);

    const { yieldOpportunities: availableVaults, isYieldOpportunitiesLoading } =
        useAllYieldOpportunities({ enabled: !isYieldDashboardDisabled });

    const { yieldAccountOpportunities, yieldInactiveVaultOpportunities, isYieldActive } =
        useYieldTableData({
            availableVaults,
            visibleAccounts,
            visibleAccountSymbols,
        });

    const {
        displayedYieldAccountOpportunities,
        hasHiddenYieldAccountOpportunities,
        isExpanded,
        toggleIsExpanded,
    } = useYieldAccountsVisibility({ yieldAccountOpportunities });

    const { merkleRewardsQuery } = useMerkleRewards(yieldAccountOpportunities);

    const badge = getEarnDashboardBadgeState({
        isSectionActive: !isYieldDashboardDisabled && isYieldActive,
        activeLabelId: 'TR_EARN_DASHBOARD_ACTIVE',
        notActiveLabelId: 'TR_EARN_DASHBOARD_NOT_ACTIVE',
    });

    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('yield')} />

            {/* TODO: add proper UI for merkle rewards  */}
            {merkleRewardsQuery.isSuccess &&
                merkleRewardsQuery.data.totalRewardsToClaim.value.gt(0) && (
                    <Column>
                        <Text>
                            Claim rewards from merkle proofs
                            <BaseCurrencyAmountFormatter
                                value={merkleRewardsQuery.data.totalRewardsToClaim.value}
                                currency={merkleRewardsQuery.data.totalRewardsToClaim.currency}
                            />
                        </Text>
                    </Column>
                )}

            <EarnDashboardSection
                titleId="TR_EARN_STABLECOIN_YIELD_TITLE"
                subheadingId="TR_EARN_YIELD_DASHBOARD_TEXT"
                provider="morpho"
                statusBadge={badge}
            >
                {isYieldDashboardDisabled ? (
                    <EarnFeatureDisabledBanner content={content} />
                ) : (
                    <Column gap={16} alignItems="center">
                        <Card paddingType="none">
                            <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                <EarnDashboardTableHeader />
                                <EarnYieldTableBody
                                    isYieldOpportunitiesLoading={isYieldOpportunitiesLoading}
                                    yieldAccountOpportunities={displayedYieldAccountOpportunities}
                                    yieldInactiveVaultOpportunities={
                                        yieldInactiveVaultOpportunities
                                    }
                                />
                            </Table>
                        </Card>

                        {hasHiddenYieldAccountOpportunities && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={toggleIsExpanded}
                            >
                                <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                            </Button>
                        )}
                    </Column>
                )}
            </EarnDashboardSection>
        </Column>
    );
};
