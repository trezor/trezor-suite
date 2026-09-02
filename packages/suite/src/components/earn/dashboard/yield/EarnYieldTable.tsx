import { useEffect, useMemo, useRef, useState } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import {
    EarnAnchor,
    gotoThunk,
    isEarnYieldRowAnchor,
    selectRouterAnchor,
    useAnchor,
} from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type YieldAccountRewards,
    type YieldDtoV2,
    useAllYieldOpportunities,
} from '@suite-common/earn-stablecoin-api';
import { Context } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { NORMAL_ACCOUNT_TYPE } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Column, Table } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { EarnYieldClaimRewardsBanner } from './EarnYieldClaimRewardsBanner';
import { EarnYieldClaimSelectAccountModal } from './EarnYieldClaimSelectAccountModal';
import { EarnYieldTableBody } from './EarnYieldTableBody';
import { PoweredByBadge } from '../../providers/PoweredByBadge';
import { getYieldOpportunityAnchor } from '../../utils/getYieldOpportunityAnchor';
import { useMerklRewards } from '../../yield/claim/hooks';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';

const emptyVaults: YieldDtoV2[] = [];

export const EarnYieldTable = () => {
    const { isBelowLaptop } = useLayoutSize();
    const isCardLayout = isBelowLaptop;
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
        availableVaults: availableVaults ?? emptyVaults,
        visibleAccounts,
        visibleAccountSymbols,
    });

    const {
        displayedYieldAccountOpportunities,
        hasHiddenYieldAccountOpportunities,
        isExpanded,
        toggleIsExpanded,
    } = useYieldAccountsVisibility({ yieldAccountOpportunities });

    // Yield badges anchor at a single row, which scrolls and highlights itself. Take over
    // the anchor to scroll the whole section when that row is not rendered — it may sit
    // behind "show more" or belong to another device.
    const routerAnchor = useSelector(selectRouterAnchor);
    // The body swaps rows for a loading or error state, so a matching opportunity only
    // means a mounted row when neither is showing.
    const hasAnchoredRow =
        !isYieldOpportunitiesError &&
        displayedYieldAccountOpportunities.some(
            opportunity =>
                getYieldOpportunityAnchor({
                    account: opportunity.account,
                    vaultId: opportunity.vault.id,
                }) === routerAnchor,
        );
    const shouldScrollWholeSection =
        isEarnYieldRowAnchor(routerAnchor) && !isYieldOpportunitiesLoading && !hasAnchoredRow;
    const { anchorRef } = useAnchor(
        shouldScrollWholeSection && routerAnchor ? routerAnchor : EarnAnchor.Yield,
    );

    const { merklRewardsQuery, missingRateTickersQuery } = useMerklRewards(yieldAccounts);
    const { accountsRewards } = merklRewardsQuery.data;
    const isClaimDisabled =
        claimMessageSystem.isDisabled ||
        !merklRewardsQuery.isSuccess ||
        accountsRewards.length === 0;

    const hasFiredReadyEventRef = useRef(false);
    const hasClaimBanner = accountsRewards.length > 0;
    const availableVaultCount = availableVaults?.length ?? 0;
    const isReadyToReport =
        !isYieldOpportunitiesLoading &&
        !isYieldOpportunitiesError &&
        merklRewardsQuery.isSuccess &&
        !missingRateTickersQuery.isLoading;

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
            gotoThunk({
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
        <Column data-testid="@earn/dashboard" gap={16}>
            <ContextMessage context={Context.getEarnDashboard('yield')} />

            <DashboardSection
                heading={<Translation id="TR_EARN_DEFI_YIELD_TITLE" />}
                subheading={<Translation id="TR_EARN_DEFI_YIELD_DASHBOARD_TEXT" />}
                actions={<PoweredByBadge provider="morpho" />}
                areActionsBelowSubheading={isCardLayout}
                ref={anchorRef}
            >
                <Column gap={16} alignItems="center">
                    {(isYieldActive || accountsRewards.length > 0) && (
                        <>
                            <EarnYieldClaimRewardsBanner
                                rewards={merklRewardsQuery}
                                isFiatRateLoading={missingRateTickersQuery.isLoading}
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
                                yieldInactiveVaultOpportunities={yieldInactiveVaultOpportunities}
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
                                    yieldAccountOpportunities={displayedYieldAccountOpportunities}
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
            </DashboardSection>
        </Column>
    );
};
