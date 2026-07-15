import { useEffect, useMemo, useRef, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import { EarnAnchor, goto, useAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import {
    type YieldAccountRewards,
    type YieldDtoV2,
    useAllYieldOpportunities,
} from '@suite-common/earn-stablecoin-api';
import { Context } from '@suite-common/message-system';
import { NORMAL_ACCOUNT_TYPE } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Column, Table } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { DashboardSection } from 'src/components/dashboard';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { EarnYieldClaimRewardsBanner } from './EarnYieldClaimRewardsBanner';
import { EarnYieldClaimSelectAccountModal } from './EarnYieldClaimSelectAccountModal';
import { EarnYieldTableBody } from './EarnYieldTableBody';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';
import { PoweredByBadge } from '../../providers/PoweredByBadge';
import { useMerklRewards } from '../../yield/claim/hooks';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';

const emptyVaults: YieldDtoV2[] = [];

export const EarnYieldTable = () => {
    const { anchorRef, shouldHighlight } = useAnchor(EarnAnchor.Yield);
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

    const { merklRewardsQuery } = useMerklRewards(yieldAccounts);
    const { accountsRewards } = merklRewardsQuery.data;
    const isClaimDisabled =
        claimMessageSystem.isDisabled ||
        !merklRewardsQuery.isSuccess ||
        accountsRewards.length === 0;

    const hasFiredReadyEventRef = useRef(false);
    const hasClaimBanner = accountsRewards.length > 0;
    const availableVaultCount = availableVaults?.length ?? 0;
    const isReadyToReport =
        !isYieldOpportunitiesLoading && !isYieldOpportunitiesError && merklRewardsQuery.isSuccess;

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
                <DashboardSection
                    heading={<Translation id="TR_EARN_DEFI_YIELD_TITLE" />}
                    subheading={<Translation id="TR_EARN_DEFI_YIELD_DASHBOARD_TEXT" />}
                    actions={<PoweredByBadge provider="morpho" />}
                    ref={anchorRef}
                >
                    <Column gap={16} alignItems="center">
                        {(isYieldActive || accountsRewards.length > 0) && (
                            <>
                                <EarnYieldClaimRewardsBanner
                                    value={merklRewardsQuery.data.totalRewardsToClaim.value}
                                    currency={merklRewardsQuery.data.totalRewardsToClaim.currency}
                                    isValueLoading={merklRewardsQuery.isLoading}
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
                </DashboardSection>
            </OutlineHighlight>
        </Column>
    );
};
