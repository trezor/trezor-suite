import { NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getFiatRateKey,
    getStakingLimitsByNetworkSymbol,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { Badge, Card, Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber, arrayPartition } from '@trezor/utils';

import { setStakingDashboardCollapsed } from 'src/actions/suite/suiteActions';
import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { StakingDashboardAccountRow } from './StakingDashboardAccountRow';
import { StakingDashboardActivateRow } from './StakingDashboardActivateRow';

const useCryptoCurrentRate = (symbol: NetworkSymbol) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    return currentRate?.rate;
};

export const StakingDashboard = () => {
    const dispatch = useDispatch();

    const collapsed = useSelector(state => state.suite.stakingDashboardCollapsed);

    const ethCurrentRate = useCryptoCurrentRate('eth');
    const solCurrentRate = useCryptoCurrentRate('sol');
    const adaCurrentRate = useCryptoCurrentRate('ada');

    const currentRates: Record<StakingNetworkSymbol, number | undefined> = {
        eth: ethCurrentRate,
        sol: solCurrentRate,
        ada: adaCurrentRate,
        thod: ethCurrentRate,
        tada: adaCurrentRate,
        dsol: solCurrentRate,
    };

    const ethStakingMessageSystem = useMessageSystemStaking('eth');
    const solStakingMessageSystem = useMessageSystemStaking('sol');
    const adaStakingMessageSystem = useMessageSystemStaking('ada');

    const isEthStakingDisabled = !!ethStakingMessageSystem.isStakingDisabled;
    const isSolStakingDisabled = !!solStakingMessageSystem.isStakingDisabled;
    const isAdaStakingDisabled = !!adaStakingMessageSystem.isStakingDisabled;

    const accounts = useSelector(selectVisibleDeviceAccounts);

    if (!accounts.some(account => account.networkType !== 'bitcoin')) {
        return null;
    }

    if (isEthStakingDisabled && isSolStakingDisabled) {
        return null;
    }

    const stakingAccounts = accounts.filter(
        account =>
            (account.symbol === 'eth' && !isEthStakingDisabled) ||
            (account.symbol === 'sol' && !isSolStakingDisabled) ||
            (account.symbol === 'ada' && !isAdaStakingDisabled),
    );

    const isStakingActive = !!stakingAccounts.find(account => {
        const stakedAmount = getAccountTotalStakingBalance(account) ?? '0';

        return new BigNumber(stakedAmount).gt(0);
    });

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

    const ethNotActivated = !stakingAccounts.find(account => account.symbol === 'eth');
    const solNotActivated = !stakingAccounts.find(account => account.symbol === 'sol');
    const adaNotActivated = !stakingAccounts.find(account => account.symbol === 'ada');
    const stakingAccountsNotActivated = ethNotActivated && solNotActivated && adaNotActivated;

    const onCollapseChange = (collapsed: boolean) => {
        dispatch(setStakingDashboardCollapsed(collapsed));
    };

    return (
        <DashboardSection
            heading={
                <>
                    <Translation id="TR_STAKING_DASHBOARD_TITLE" />
                    <Badge
                        intent={isStakingActive ? 'brand' : 'neutral'}
                        margin={{ left: spacings.sm }}
                    >
                        <Translation
                            id={
                                isStakingActive
                                    ? 'TR_STAKING_DASHBOARD_ACTIVE'
                                    : 'TR_STAKING_DASHBOARD_NOT_ACTIVE'
                            }
                        />
                    </Badge>
                </>
            }
            subheading={<Translation id="TR_STAKING_DASHBOARD_TEXT" />}
            collapsible
            defaultCollapsed={collapsed}
            onCollapseChange={onCollapseChange}
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
    );
};
