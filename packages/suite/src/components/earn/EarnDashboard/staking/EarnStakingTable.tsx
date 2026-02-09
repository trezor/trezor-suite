import { NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountIsStakingActive,
    selectBaseCurrency,
    selectDeviceSupportedNetworks,
    selectFiatRatesByFiatRateKey,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getFiatRateKey,
    getStakingLimitsByNetworkSymbol,
    isCardanoStakedWithFiveBinaries,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { Card, Table } from '@trezor/components';
import { BigNumber, arrayPartition } from '@trezor/utils';

import { OutlineHighlight } from 'src/components/OutlineHighlight';
import { DashboardAnchor } from 'src/constants/suite/anchors';
import { useSelector } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { EarnStakingAccountRow } from './EarnStakingAccountRow';
import { EarnStakingActivateRow } from './EarnStakingActivateRow';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { getEarnDashboardBadgeState } from '../utils/earnDashboardBadgeUtils';

const useCryptoCurrentRate = (symbol: NetworkSymbol) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    return currentRate?.rate;
};

export const EarnStakingTable = () => {
    const { anchorRef, shouldHighlight } = useAnchor(DashboardAnchor.Staking);

    const ethCurrentRate = useCryptoCurrentRate('eth');
    const solCurrentRate = useCryptoCurrentRate('sol');
    const adaCurrentRate = useCryptoCurrentRate('ada');

    const currentRates: Record<StakingNetworkSymbol, number | undefined> = {
        eth: ethCurrentRate,
        sol: solCurrentRate,
        ada: adaCurrentRate,
        thod: ethCurrentRate,
        dsol: solCurrentRate,
    };

    const ethStakingMessageSystem = useMessageSystemStaking('eth');
    const solStakingMessageSystem = useMessageSystemStaking('sol');
    const adaStakingMessageSystem = useMessageSystemStaking('ada');

    const isEthStakingDisabled = !!ethStakingMessageSystem.isStakingDisabled;
    const isSolStakingDisabled = !!solStakingMessageSystem.isStakingDisabled;
    const isAdaStakingDisabled = !!adaStakingMessageSystem.isStakingDisabled;

    const accounts = useSelector(selectVisibleDeviceAccounts);

    const stakingAccounts = accounts.filter(
        account =>
            (account.symbol === 'eth' && !isEthStakingDisabled) ||
            (account.symbol === 'sol' && !isSolStakingDisabled) ||
            (account.symbol === 'ada' && !isAdaStakingDisabled),
    );

    const isStakingActive = useSelector(state =>
        stakingAccounts.some(account => selectAccountIsStakingActive(state, account.key)),
    );
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    if (!accounts.some(account => account.networkType !== 'bitcoin')) {
        return null;
    }

    if (isEthStakingDisabled && isSolStakingDisabled && isAdaStakingDisabled) {
        return null;
    }

    const [accountsStakingActive, accountsStakingNotActive] = arrayPartition(
        stakingAccounts,
        (account: Account) => {
            const stakedAmount = getAccountTotalStakingBalance(account);

            return stakedAmount !== null && stakedAmount !== '0';
        },
    );

    const [accountsSufficientFunds, accountsInsufficientFunds] = arrayPartition(
        accountsStakingNotActive,
        (account: Account) => {
            const minStakingAmount = getStakingLimitsByNetworkSymbol(
                account.symbol,
            )?.MIN_AMOUNT_FOR_STAKING;

            return (
                minStakingAmount !== undefined &&
                new BigNumber(account.formattedBalance).gte(minStakingAmount)
            );
        },
    );

    const sortAccountsByStakedAmount = (a: Account, b: Account) => {
        const getAccountStakedAmountInFiat = (account: Account) => {
            const stakedAmountInCrypto = getAccountTotalStakingBalance(account) ?? '0';
            const fiatCurrency = toFiatCurrency({
                amount: stakedAmountInCrypto,
                rate: currentRates[account.symbol as StakingNetworkSymbol],
            });
            const stakedAmountInFiat = new BigNumber(fiatCurrency ?? '0');

            return stakedAmountInFiat;
        };

        const aStakedAmount = getAccountStakedAmountInFiat(a);
        const bStakedAmount = getAccountStakedAmountInFiat(b);

        return bStakedAmount.minus(aStakedAmount).toNumber();
    };

    const sortAccountsByBalance = (a: Account, b: Account) => {
        const getAccountBalanceInFiat = (account: Account) => {
            const fiatCurrency = toFiatCurrency({
                amount: account.formattedBalance,
                rate: currentRates[account.symbol as StakingNetworkSymbol],
            });
            const accountBalanceInFiat = new BigNumber(fiatCurrency ?? '0');

            return accountBalanceInFiat;
        };

        const aAccountBalance = getAccountBalanceInFiat(a);
        const bAccountBalance = getAccountBalanceInFiat(b);

        return bAccountBalance.minus(aAccountBalance).toNumber();
    };

    const sortedAccounts = [
        ...accountsStakingActive.toSorted(sortAccountsByStakedAmount),
        ...accountsSufficientFunds.toSorted(sortAccountsByBalance),
        ...accountsInsufficientFunds.toSorted(sortAccountsByBalance),
    ];

    const ethNotActivated =
        deviceSupportedNetworkSymbols.includes('eth') &&
        !stakingAccounts.some(account => account.symbol === 'eth') &&
        !isEthStakingDisabled;
    const solNotActivated =
        deviceSupportedNetworkSymbols.includes('sol') &&
        !stakingAccounts.some(account => account.symbol === 'sol') &&
        !isSolStakingDisabled;
    const adaNotActivated =
        deviceSupportedNetworkSymbols.includes('ada') &&
        !stakingAccounts.some(account => account.symbol === 'ada') &&
        !isAdaStakingDisabled;
    const stakingAccountsNotActivated = ethNotActivated && solNotActivated && adaNotActivated;

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
        <OutlineHighlight shouldHighlight={shouldHighlight}>
            <EarnDashboardSection
                titleId="TR_EARN_STAKING_DASHBOARD_TITLE"
                subheadingId="TR_EARN_STAKING_DASHBOARD_TEXT"
                provider="everstake"
                statusBadge={badge}
                sectionRef={anchorRef}
            >
                <Card paddingType="none">
                    <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                        <EarnDashboardTableHeader
                            showRewardsColumns={!stakingAccountsNotActivated}
                        />

                        <Table.Body>
                            {sortedAccounts.map(account => (
                                <EarnStakingAccountRow account={account} key={account.key} />
                            ))}

                            {ethNotActivated && <EarnStakingActivateRow symbol="eth" />}
                            {adaNotActivated && <EarnStakingActivateRow symbol="ada" />}
                            {solNotActivated && <EarnStakingActivateRow symbol="sol" />}
                        </Table.Body>
                    </Table>
                </Card>
            </EarnDashboardSection>
        </OutlineHighlight>
    );
};
