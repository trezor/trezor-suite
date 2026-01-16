import { Translation, TranslationKey } from '@suite/intl';
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
import { Badge, BadgeIntent, Card, Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber, arrayPartition } from '@trezor/utils';

import { setStakingDashboardCollapsed } from 'src/actions/suite/suiteActions';
import { OutlineHighlight } from 'src/components/OutlineHighlight';
import { DashboardSection } from 'src/components/dashboard';
import { DashboardAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { StakingDashboardAccountRow } from './StakingDashboardAccountRow';
import { StakingDashboardActivateRow } from './StakingDashboardActivateRow';

const getBadgeState = (
    isStakingActive: boolean,
    accounts: Account[],
): { intent: BadgeIntent; label: TranslationKey } => {
    if (!isStakingActive) {
        return {
            intent: 'neutral',
            label: 'TR_STAKING_DASHBOARD_NOT_ACTIVE',
        };
    }

    if (accounts.some(account => isCardanoStakedWithFiveBinaries(account))) {
        return {
            intent: 'warning',
            label: 'TR_STAKING_DASHBOARD_OUTDATED',
        };
    }

    return {
        intent: 'brand',
        label: 'TR_STAKING_DASHBOARD_ACTIVE',
    };
};

const useCryptoCurrentRate = (symbol: NetworkSymbol) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    return currentRate?.rate;
};

interface StakingDashboardProps {
    collapsible?: boolean;
}

export const StakingDashboard = ({ collapsible = true }: StakingDashboardProps) => {
    const dispatch = useDispatch();

    const collapsed = useSelector(state => state.suite.stakingDashboardCollapsed);

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
        !stakingAccounts.find(account => account.symbol === 'eth');
    const solNotActivated =
        deviceSupportedNetworkSymbols.includes('sol') &&
        !stakingAccounts.find(account => account.symbol === 'sol');
    const adaNotActivated =
        deviceSupportedNetworkSymbols.includes('ada') &&
        !stakingAccounts.find(account => account.symbol === 'ada');
    const stakingAccountsNotActivated = ethNotActivated && solNotActivated && adaNotActivated;

    const onCollapseChange = (collapsed: boolean) => {
        if (!collapsible) return;
        dispatch(setStakingDashboardCollapsed(collapsed));
    };

    const badge = getBadgeState(isStakingActive, stakingAccounts);

    return (
        <OutlineHighlight shouldHighlight={shouldHighlight}>
            <DashboardSection
                heading={
                    <>
                        <Translation id="TR_STAKING_DASHBOARD_TITLE" />
                        <Badge intent={badge.intent} margin={{ left: spacings.sm }}>
                            <Translation id={badge.label} />
                        </Badge>
                    </>
                }
                subheading={<Translation id="TR_STAKING_DASHBOARD_TEXT" />}
                collapsible={collapsible}
                defaultCollapsed={collapsible ? collapsed : false}
                onCollapseChange={onCollapseChange}
                ref={anchorRef}
            >
                <Card paddingType="none">
                    <Table isRowHighlightedOnHover margin={{ top: spacings.xs }}>
                        <Table.Header>
                            <Table.Row>
                                <Table.Cell>
                                    <Translation id="TR_STAKING_DASHBOARD_TABLE_ACCOUNT_BALANCE" />
                                </Table.Cell>
                                <Table.Cell>
                                    <Translation id="TR_STAKING_DASHBOARD_TABLE_APY" />
                                </Table.Cell>
                                <Table.Cell>
                                    {!stakingAccountsNotActivated && (
                                        <Translation id="TR_STAKING_DASHBOARD_TABLE_YEARLY_REWARDS" />
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    {!stakingAccountsNotActivated && (
                                        <Translation id="TR_STAKING_DASHBOARD_TABLE_POTENTIAL_REWARDS" />
                                    )}
                                </Table.Cell>
                                <Table.Cell></Table.Cell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {sortedAccounts.map(account => (
                                <StakingDashboardAccountRow account={account} key={account.key} />
                            ))}

                            {ethNotActivated && !isEthStakingDisabled && (
                                <StakingDashboardActivateRow symbol="eth" />
                            )}
                            {solNotActivated && !isSolStakingDisabled && (
                                <StakingDashboardActivateRow symbol="sol" />
                            )}
                            {adaNotActivated && !isAdaStakingDisabled && (
                                <StakingDashboardActivateRow symbol="ada" />
                            )}
                        </Table.Body>
                    </Table>
                </Card>
            </DashboardSection>
        </OutlineHighlight>
    );
};
