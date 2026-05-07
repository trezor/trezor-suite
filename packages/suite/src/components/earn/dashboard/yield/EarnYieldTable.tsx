import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectIsDebugModeActive } from '@suite/settings';
import { Context } from '@suite-common/message-system';
import { NORMAL_ACCOUNT_TYPE, isEarnYieldClaimSupported } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button, Card, Column, Table } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemEarnDashboard } from 'src/hooks/suite/useMessageSystemEarnDashboard';

import { EarnYieldClaimRewardsBanner } from './EarnYieldClaimRewardsBanner';
import {
    EarnYieldClaimSelectAccountModal,
    type EarnYieldClaimableAccount,
} from './EarnYieldClaimSelectAccountModal';
import { EarnYieldTableBody } from './EarnYieldTableBody';
import { useAllYieldOpportunities } from './hooks/useAllYieldOpportunities';
import { useMerkleRewards } from './hooks/useMerkleRewards';
import { useYieldAccountsVisibility } from './hooks/useYieldAccountsVisibility';
import { useYieldTableData } from './hooks/useYieldTableData';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { EarnFeatureDisabledBanner } from '../common/EarnFeatureDisabledBanner';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';
import { getClaimableAccounts } from '../utils/earnYieldUtils';

export const EarnYieldTable = () => {
    const dispatch = useDispatch();
    const { isDisabled: isYieldDashboardDisabled, content } =
        useMessageSystemEarnDashboard('yield');
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

    const isDebugMode = useSelector(selectIsDebugModeActive);
    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const visibleAccountSymbols = useMemo(() => {
        const normalAccounts = visibleAccounts.filter(
            account => account.accountType === NORMAL_ACCOUNT_TYPE,
        );

        return new Set(normalAccounts.map(account => account.symbol));
    }, [visibleAccounts]);

    const { yieldOpportunities: availableVaults, isYieldOpportunitiesLoading } =
        useAllYieldOpportunities({ enabled: !isYieldDashboardDisabled });

    const {
        yieldAccountOpportunities,
        yieldInactiveVaultOpportunities,
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

    const merkleRewardsSources = useMemo(
        () =>
            yieldAccountOpportunities.flatMap(opportunity => {
                const { networkSymbol, account } = opportunity;
                if (
                    !(
                        isEarnYieldClaimSupported(networkSymbol, { isDebugMode }) &&
                        account &&
                        account.networkType === 'ethereum'
                    )
                ) {
                    return [];
                }

                // account with nonce 1 sent only 1 tx (when user supplies, first tx is approval)
                const isEmptyAccount = Number(account?.misc?.nonce ?? 0) <= 1;

                if (isEmptyAccount) {
                    return [];
                }

                return [
                    {
                        networkSymbol,
                        address: account.descriptor,
                    },
                ];
            }),
        [yieldAccountOpportunities, isDebugMode],
    );
    const { merkleRewardsQuery } = useMerkleRewards(merkleRewardsSources);
    const { rewards } = merkleRewardsQuery.data;
    const claimableAccounts = useMemo<EarnYieldClaimableAccount[]>(
        () =>
            merkleRewardsQuery.isSuccess ? getClaimableAccounts({ rewards, visibleAccounts }) : [],
        [merkleRewardsQuery.isSuccess, rewards, visibleAccounts],
    );
    const isClaimDisabled = !merkleRewardsQuery.isSuccess || claimableAccounts.length === 0;

    const badge = getEarnDashboardBadgeState({
        isSectionActive: !isYieldDashboardDisabled && isYieldActive,
        activeLabelId: 'TR_EARN_DASHBOARD_ACTIVE',
        notActiveLabelId: 'TR_EARN_DASHBOARD_NOT_ACTIVE',
    });

    const handleClaimableAccountSelect = (claimableAccount: EarnYieldClaimableAccount) => {
        dispatch(
            goto({
                routeName: 'earn-claim',
                params: {
                    symbol: claimableAccount.account.symbol,
                    accountIndex: claimableAccount.account.index,
                    accountType: claimableAccount.account.accountType,
                },
            }),
        );
        setIsClaimModalOpen(false);
    };

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('yield')} />

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
                        {(isYieldActive || claimableAccounts.length > 0) && (
                            <>
                                <EarnYieldClaimRewardsBanner
                                    value={merkleRewardsQuery.data.totalRewardsToClaim.value}
                                    currency={merkleRewardsQuery.data.totalRewardsToClaim.currency}
                                    isValueLoading={merkleRewardsQuery.isLoading}
                                    isClaimDisabled={isClaimDisabled}
                                    onClaim={() => setIsClaimModalOpen(true)}
                                />
                                {isClaimModalOpen && (
                                    <EarnYieldClaimSelectAccountModal
                                        claimableAccounts={claimableAccounts}
                                        onSelect={handleClaimableAccountSelect}
                                        onClose={() => setIsClaimModalOpen(false)}
                                    />
                                )}
                            </>
                        )}
                        <Card paddingType="none">
                            <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                <EarnDashboardTableHeader
                                    accountColumnTranslationId="TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT"
                                    showRewardsColumns={hasAnyRewardsData}
                                />
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
