import { useEffect, useMemo, useRef, useState } from 'react';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { EarnAnchor, goto, useAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { Context } from '@suite-common/message-system';
import { NORMAL_ACCOUNT_TYPE } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Column, Table } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { EarnYieldClaimRewardsBanner } from './EarnYieldClaimRewardsBanner';
import { EarnYieldClaimSelectAccountModal } from './EarnYieldClaimSelectAccountModal';
import { EarnYieldTableBody } from './EarnYieldTableBody';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';
import { type YieldAccountRewards, useMerkleRewards } from '../../yield/claim/hooks';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';

export const EarnYieldTable = () => {
    const { anchorRef, shouldHighlight } = useAnchor(EarnAnchor.Yield);
    const { isBelowLaptop } = useLayoutSize();
    const isCardLayout = isBelowLaptop;
    const dispatch = useDispatch();
    const { analytics } = useServices<DesktopAnalyticsDep>();
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const claimMessageSystem = useMessageSystemYield('claim');

    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const visibleAccountSymbols = useMemo(() => {
        const normalAccounts = visibleAccounts.filter(
            account => account.accountType === NORMAL_ACCOUNT_TYPE,
        );

        return new Set(normalAccounts.map(account => account.symbol));
    }, [visibleAccounts]);

    const {
        data: availableVaults,
        isLoading: isYieldOpportunitiesLoading,
        isError: isYieldOpportunitiesError,
        refetch: refetchYieldOpportunities,
    } = useAllYieldOpportunities();

    const {
        yieldAccountOpportunities,
        yieldInactiveVaultOpportunities,
        yieldAccounts,
        isYieldActive,
        hasAnyRewardsData,
    } = useYieldTableData({
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

    const { merkleRewardsQuery } = useMerkleRewards(yieldAccounts);
    const { accountsRewards } = merkleRewardsQuery.data;
    const isClaimDisabled =
        claimMessageSystem.isDisabled ||
        !merkleRewardsQuery.isSuccess ||
        accountsRewards.length === 0;

    const badge = getEarnDashboardBadgeState({
        isSectionActive: isYieldActive,
        activeLabelId: 'TR_EARN_DASHBOARD_ACTIVE',
        notActiveLabelId: 'TR_EARN_DASHBOARD_NOT_ACTIVE',
    });

    const hasFiredReadyEventRef = useRef(false);
    const hasClaimBanner = accountsRewards.length > 0;
    const availableVaultCount = availableVaults?.length ?? 0;
    const isReadyToReport =
        !isYieldOpportunitiesLoading && !isYieldOpportunitiesError && merkleRewardsQuery.isSuccess;

    useEffect(() => {
        if (!isReadyToReport || hasFiredReadyEventRef.current) {
            return;
        }
        hasFiredReadyEventRef.current = true;

        analytics.report({
            type: events.yieldEarnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner,
                hasActivePosition: isYieldActive,
                availableVaultCount,
                hasShowMore: hasHiddenYieldAccountOpportunities,
            },
        });
    }, [
        analytics,
        isReadyToReport,
        hasClaimBanner,
        isYieldActive,
        availableVaultCount,
        hasHiddenYieldAccountOpportunities,
    ]);

    const handleToggleShowMore = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'show-more-accounts',
                value: isExpanded ? 'collapse' : 'expand',
            },
        });

        toggleIsExpanded();
    };

    const handleClaimableAccountSelect = ({ account }: YieldAccountRewards) => {
        dispatch(
            goto({
                routeName: 'earn-yield-claim',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        setIsClaimModalOpen(false);
    };

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('yield')} />

            <OutlineHighlight shouldHighlight={shouldHighlight}>
                <EarnDashboardSection
                    titleId="TR_EARN_STABLECOIN_YIELD_TITLE"
                    subheadingId="TR_EARN_YIELD_DASHBOARD_TEXT"
                    provider="morpho"
                    statusBadge={badge}
                    sectionRef={anchorRef}
                >
                    <Column gap={16} alignItems="center">
                        {(isYieldActive || accountsRewards.length > 0) && (
                            <>
                                <EarnYieldClaimRewardsBanner
                                    value={merkleRewardsQuery.data.totalRewardsToClaim.value}
                                    currency={merkleRewardsQuery.data.totalRewardsToClaim.currency}
                                    isValueLoading={merkleRewardsQuery.isLoading}
                                    isClaimDisabled={isClaimDisabled}
                                    claimDisabledTooltip={
                                        claimMessageSystem.isDisabled
                                            ? claimMessageSystem.content
                                            : undefined
                                    }
                                    onClaim={() => setIsClaimModalOpen(true)}
                                />
                                {isClaimModalOpen && (
                                    <EarnYieldClaimSelectAccountModal
                                        accountsRewards={accountsRewards}
                                        onSelect={handleClaimableAccountSelect}
                                        onClose={() => setIsClaimModalOpen(false)}
                                    />
                                )}
                            </>
                        )}

                        {isCardLayout ? (
                            <Column gap={8} width="100%">
                                <EarnYieldTableBody
                                    isYieldOpportunitiesLoading={isYieldOpportunitiesLoading}
                                    isYieldOpportunitiesError={isYieldOpportunitiesError}
                                    onRetry={refetchYieldOpportunities}
                                    yieldAccountOpportunities={displayedYieldAccountOpportunities}
                                    yieldInactiveVaultOpportunities={
                                        yieldInactiveVaultOpportunities
                                    }
                                    isCardLayout={isCardLayout}
                                />
                            </Column>
                        ) : (
                            <Card paddingType="none">
                                <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                    <EarnDashboardTableHeader
                                        accountColumnTranslationId="TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT"
                                        showRewardsColumns={hasAnyRewardsData}
                                    />
                                    <EarnYieldTableBody
                                        isYieldOpportunitiesLoading={isYieldOpportunitiesLoading}
                                        isYieldOpportunitiesError={isYieldOpportunitiesError}
                                        onRetry={refetchYieldOpportunities}
                                        yieldAccountOpportunities={
                                            displayedYieldAccountOpportunities
                                        }
                                        yieldInactiveVaultOpportunities={
                                            yieldInactiveVaultOpportunities
                                        }
                                        isCardLayout={isCardLayout}
                                    />
                                </Table>
                            </Card>
                        )}

                        {hasHiddenYieldAccountOpportunities && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={handleToggleShowMore}
                            >
                                <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                            </Button>
                        )}
                    </Column>
                </EarnDashboardSection>
            </OutlineHighlight>
        </Column>
    );
};
