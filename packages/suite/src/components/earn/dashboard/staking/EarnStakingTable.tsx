import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { EarnAnchor, useAnchor } from '@suite/router';
import { Context } from '@suite-common/message-system';
import { type StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountIsStakingActive,
    selectDeviceSupportedNetworks,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { Button, Card, Column, Table } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';

import { EarnStakingAccountRow } from './EarnStakingAccountRow';
import { EarnStakingActivateRow } from './EarnStakingActivateRow';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';
import { useCryptoCurrentRate } from './hooks/useCryptoCurrencyRate';
import { useStakingAccountsVisibility } from './hooks/useStakingAccountsVisibility';

export const EarnStakingTable = () => {
    const { anchorRef, shouldHighlight } = useAnchor(EarnAnchor.Staking);
    const ethCurrentRate = useCryptoCurrentRate('eth');
    const solCurrentRate = useCryptoCurrentRate('sol');
    const adaCurrentRate = useCryptoCurrentRate('ada');

    const currentRates: Record<StakingNetworkSymbol, number | undefined> = useMemo(
        () => ({
            eth: ethCurrentRate,
            sol: solCurrentRate,
            ada: adaCurrentRate,
            thod: ethCurrentRate,
            dsol: solCurrentRate,
        }),
        [ethCurrentRate, solCurrentRate, adaCurrentRate],
    );

    const accounts = useSelector(selectVisibleDeviceAccounts);

    const stakingAccounts = accounts.filter(
        account => account.symbol === 'eth' || account.symbol === 'sol' || account.symbol === 'ada',
    );

    const isStakingActive = useSelector(state =>
        stakingAccounts.some(account => selectAccountIsStakingActive(state, account.key)),
    );
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const ethNotActivated =
        deviceSupportedNetworkSymbols.includes('eth') &&
        !stakingAccounts.some(account => account.symbol === 'eth');

    const solNotActivated =
        deviceSupportedNetworkSymbols.includes('sol') &&
        !stakingAccounts.some(account => account.symbol === 'sol');

    const adaNotActivated =
        deviceSupportedNetworkSymbols.includes('ada') &&
        !stakingAccounts.some(account => account.symbol === 'ada');

    const { displayedAccounts, isExpandable, isExpanded, toggleExpanded, hasAnyRewardsData } =
        useStakingAccountsVisibility({
            stakingAccounts,
            currentRates,
            ethNotActivated,
            solNotActivated,
            adaNotActivated,
        });

    const badge = getEarnDashboardBadgeState({
        isSectionActive: isStakingActive,
        isSectionOutdated: stakingAccounts.some(account =>
            isCardanoStakedWithFiveBinaries(account),
        ),
        activeLabelId: 'TR_EARN_DASHBOARD_ACTIVE',
        notActiveLabelId: 'TR_EARN_DASHBOARD_NOT_ACTIVE',
        outdatedLabelId: 'TR_EARN_STAKING_DASHBOARD_OUTDATED',
    });

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('staking')} />

            <OutlineHighlight shouldHighlight={shouldHighlight}>
                <EarnDashboardSection
                    titleId="TR_EARN_STAKING_DASHBOARD_TITLE"
                    subheadingId="TR_EARN_STAKING_DASHBOARD_TEXT"
                    provider="everstake"
                    statusBadge={badge}
                    sectionRef={anchorRef}
                >
                    <Column gap={16} alignItems="center">
                        <Card paddingType="none">
                            <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                <EarnDashboardTableHeader
                                    accountColumnTranslationId="TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE"
                                    showRewardsColumns={hasAnyRewardsData}
                                />

                                <Table.Body>
                                    {displayedAccounts.map(account => (
                                        <EarnStakingAccountRow
                                            account={account}
                                            key={account.key}
                                        />
                                    ))}

                                    {ethNotActivated && <EarnStakingActivateRow symbol="eth" />}
                                    {adaNotActivated && <EarnStakingActivateRow symbol="ada" />}
                                    {solNotActivated && <EarnStakingActivateRow symbol="sol" />}
                                </Table.Body>
                            </Table>
                        </Card>

                        {isExpandable && (
                            <Button intent="neutral" priority="secondary" onClick={toggleExpanded}>
                                <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                            </Button>
                        )}
                    </Column>
                </EarnDashboardSection>
            </OutlineHighlight>
        </Column>
    );
};
