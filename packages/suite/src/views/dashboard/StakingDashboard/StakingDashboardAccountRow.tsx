import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    calculateYearlyRewards,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Button, Column, H4, Icon, Paragraph, Row, Table } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { BigNumber } from '@trezor/utils';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { StakingDashboardAccountCell } from './StakingDashboardAccountCell';

export const StakingDashboardAccountRow = ({ account }: { account: Account }) => {
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();

    const apy = useSelector(state => selectPoolStatsApyData(state, account.symbol));
    const displaySymbol = getDisplaySymbol(account.symbol);

    const { MIN_AMOUNT_FOR_STAKING } = getStakingLimitsByNetworkSymbol(account.symbol);

    const accountBalance = account.formattedBalance;
    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const navigateToTradingBuy = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();

        dispatch(
            goto('wallet-trading-buy', {
                preserveParams: true,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: EventType.TradingNavigate,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'dashboard/staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const navigateToStaking = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event?.stopPropagation();

        dispatch(
            goto('wallet-staking', {
                preserveParams: true,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'navigate',
                from: 'dashboard/staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const formatCryptoAmount = (amount: string, withSymbol = false) =>
        CryptoAmountFormatter.format(amount, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol,
            maxDisplayedDecimals: 8,
            isEllipsisAppended: false,
        });

    const state = useMemo(() => {
        if (accountBalance === '0' && stakingBalance !== '0') {
            return 'staking-max';
        }

        const hasEnoughBalanceForStaking = new BigNumber(accountBalance).gte(
            MIN_AMOUNT_FOR_STAKING,
        );

        if (stakingBalance !== '0') {
            if (!hasEnoughBalanceForStaking) {
                return 'staking-max';
            }

            return 'staking-active';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'insufficient-funds';
        }

        return 'staking-inactive';
    }, [accountBalance, stakingBalance, MIN_AMOUNT_FOR_STAKING]);

    const CurrentRewardsCell = () => {
        const isStakingActive = stakingBalance !== '0';
        const currentRewards = calculateYearlyRewards(stakingBalance, apy);

        return (
            <Table.Cell>
                <Row width="100%" alignItems="center" justifyContent="space-between">
                    <Column alignItems="flex-start">
                        <H4>{formatCryptoAmount(isStakingActive ? currentRewards : '0', true)}</H4>

                        {isStakingActive && (
                            <Paragraph typographyStyle="hint" variant="tertiary">
                                <Translation
                                    id="TR_STAKING_DASHBOARD_STAKED"
                                    values={{
                                        amount: formatCryptoAmount(stakingBalance),
                                        displaySymbol,
                                    }}
                                />
                            </Paragraph>
                        )}
                    </Column>

                    <Icon name="arrowRight" variant="tertiary" size="mediumLarge" />
                </Row>
            </Table.Cell>
        );
    };

    const PotentialRewardsCell = () => {
        const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
        const potentialRewards = calculateYearlyRewards(totalBalance, apy);

        return (
            <Table.Cell>
                <Column>
                    <H4 variant="primary">{formatCryptoAmount(potentialRewards, true)}</H4>

                    <Paragraph typographyStyle="hint" variant="tertiary">
                        <Translation
                            id="TR_STAKING_DASHBOARD_IF_YOU_ADD"
                            values={{
                                amount: formatCryptoAmount(accountBalance),
                                displaySymbol,
                            }}
                        />
                    </Paragraph>
                </Column>
            </Table.Cell>
        );
    };

    return (
        <Table.Row onClick={navigateToStaking}>
            <Table.Cell>
                <StakingDashboardAccountCell account={account} />
            </Table.Cell>

            <Table.Cell>~{apy}%</Table.Cell>

            {state === 'insufficient-funds' && (
                <>
                    <Table.Cell colSpan={2}>
                        <Paragraph typographyStyle="body" variant="tertiary">
                            <Translation
                                id="TR_STAKING_DASHBOARD_MINIMUM_STAKE"
                                values={{
                                    amount: MIN_AMOUNT_FOR_STAKING.toString(),
                                    displaySymbol,
                                }}
                            />
                        </Paragraph>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button variant="tertiary" size="small" onClick={navigateToTradingBuy}>
                            <Translation id="TR_BUY" />
                        </Button>
                    </Table.Cell>
                </>
            )}

            {(state === 'staking-active' || state === 'staking-inactive') && (
                <>
                    <CurrentRewardsCell />
                    <PotentialRewardsCell />

                    <Table.Cell align="end">
                        <Button variant="primary" size="small" onClick={navigateToStaking}>
                            <Translation
                                id={
                                    state === 'staking-active'
                                        ? 'TR_STAKING_DASHBOARD_STAKE_MORE'
                                        : 'TR_STAKING_DASHBOARD_STAKE_NOW'
                                }
                            />
                        </Button>
                    </Table.Cell>
                </>
            )}

            {state === 'staking-max' && (
                <>
                    <CurrentRewardsCell />

                    <Table.Cell>
                        <Paragraph typographyStyle="body" variant="tertiary">
                            <Translation id="TR_STAKING_DASHBOARD_MAXIMUM_STAKE" />
                        </Paragraph>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button variant="tertiary" size="small" onClick={navigateToTradingBuy}>
                            <Translation id="TR_BUY" />
                        </Button>
                    </Table.Cell>
                </>
            )}
        </Table.Row>
    );
};
