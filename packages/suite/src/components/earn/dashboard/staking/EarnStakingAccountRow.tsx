import { useMemo } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useFormatters } from '@suite-common/formatters';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    selectAccountIsStakingActive,
    selectCardanoPoolsInfo,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
    isCardanoStakedOutsideEverstake,
} from '@suite-common/wallet-utils';
import { Button, Column, Icon, Paragraph, Row, Table } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';
import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

import { EarnAccountCell } from '../common/EarnAccountCell';
import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

export const EarnStakingAccountRow = ({ account }: { account: Account }) => {
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const analytics = useAnalytics();
    const apy = useSelector(state => selectPoolStatsApyData(state, account));
    const displaySymbol = getDisplaySymbol(account.symbol);
    const isCardanoNetworkType = account.networkType === 'cardano';
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);

    const minStakingAmount = getStakingLimitsByNetworkSymbol(
        account.symbol,
    )?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

    const accountBalance = account.formattedBalance;
    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    const state = useMemo(() => {
        if (
            isCardanoStakedOutsideEverstake(account, cardanoStakingPools) &&
            isNewProviderBannerEnabled
        ) {
            return 'staking-outdated-provider';
        }

        if (
            (accountBalance === '0' && stakingBalance !== '0') ||
            (isCardanoNetworkType && isStakingActive)
        ) {
            return 'staking-max';
        }

        const hasEnoughBalanceForStaking =
            minStakingAmount && new BigNumber(accountBalance).gte(minStakingAmount);

        if (stakingBalance !== '0') {
            if (!hasEnoughBalanceForStaking) {
                return 'staked-but-insufficient-funds';
            }

            return 'staking-active';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'insufficient-funds';
        }

        return 'staking-inactive';
    }, [
        account,
        accountBalance,
        stakingBalance,
        minStakingAmount,
        isCardanoNetworkType,
        isStakingActive,
        cardanoStakingPools,
        isNewProviderBannerEnabled,
    ]);

    const navigateToTradingBuy = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();

        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account),
            ),
        );
        dispatch(goto({ routeName: 'wallet-trading-buy' }));

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'dashboard/staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const navigateToStaking = () => {
        dispatch(
            goto({
                routeName: 'wallet-staking',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'navigate',
                from: `dashboard/staking-dashboard/${state}`,
                networkSymbol: account.symbol,
            },
        });
    };

    const formatCryptoAmount = (amount: string, withSymbol = false) =>
        CryptoAmountFormatter.format(amount, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });

    const CurrentRewardsCell = () => {
        const currentRewards = calculateRewards(stakingBalance, apy);

        return (
            <Table.Cell>
                <Row width="100%" alignItems="center" justifyContent="space-between">
                    <Column alignItems="flex-start">
                        <EarnRewardsAmount
                            symbol={account.symbol}
                            rewards={isStakingActive ? currentRewards : '0'}
                            apy={apy}
                        />

                        {isStakingActive && (
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <HiddenPlaceholder>
                                    <Translation
                                        id="TR_EARN_STAKING_DASHBOARD_STAKED"
                                        values={{
                                            amount: formatCryptoAmount(stakingBalance),
                                            displaySymbol,
                                        }}
                                    />
                                </HiddenPlaceholder>
                            </Paragraph>
                        )}
                    </Column>

                    {apy && (
                        <Icon name="arrowRight" intent="neutral" priority="secondary" size={20} />
                    )}
                </Row>
            </Table.Cell>
        );
    };

    const PotentialRewardsCell = () => {
        const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
        const potentialRewards = calculateRewards(
            getNetworkAdjustedStakingBalance(totalBalance, account),
            apy,
        );

        return (
            <Table.Cell>
                <Column>
                    {apy && (
                        <EarnRewardsAmount
                            symbol={account.symbol}
                            rewards={potentialRewards}
                            apy={apy}
                            intent="brand"
                        />
                    )}

                    {!isCardanoNetworkType && apy && (
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <HiddenPlaceholder>
                                <Translation
                                    id="TR_EARN_STAKING_DASHBOARD_IF_YOU_ADD"
                                    values={{
                                        amount: formatCryptoAmount(accountBalance),
                                        displaySymbol,
                                    }}
                                />
                            </HiddenPlaceholder>
                        </Paragraph>
                    )}
                </Column>
            </Table.Cell>
        );
    };

    return (
        <Table.Row onClick={navigateToStaking}>
            <Table.Cell>
                <EarnAccountCell account={account} />
            </Table.Cell>

            <Table.Cell>
                {state === 'staking-outdated-provider' ? (
                    <Translation id="TR_EARN_NOT_AVAILABLE" />
                ) : (
                    <ApyValue apy={apy} />
                )}
            </Table.Cell>

            {state === 'insufficient-funds' && (
                <>
                    <Table.Cell colSpan={2}>
                        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                                values={{
                                    amount: minStakingAmount?.toString(),
                                    displaySymbol,
                                }}
                            />
                        </Paragraph>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onClick={navigateToTradingBuy}
                        >
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
                        <Button intent="brand" size="small" onClick={navigateToStaking}>
                            <Translation
                                id={
                                    state === 'staking-active'
                                        ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                                        : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
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
                        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id="TR_EARN_STAKING_DASHBOARD_MAXIMUM_STAKE" />
                        </Paragraph>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onClick={navigateToTradingBuy}
                        >
                            <Translation id="TR_BUY" />
                        </Button>
                    </Table.Cell>
                </>
            )}

            {state === 'staked-but-insufficient-funds' && (
                <>
                    <CurrentRewardsCell />

                    <Table.Cell>
                        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                                values={{
                                    amount: minStakingAmount?.toString(),
                                    displaySymbol,
                                }}
                            />
                        </Paragraph>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onClick={navigateToTradingBuy}
                        >
                            <Translation id="TR_BUY" />
                        </Button>
                    </Table.Cell>
                </>
            )}

            {state === 'staking-outdated-provider' && (
                <>
                    <Table.Cell colSpan={2}>
                        <Row gap={4}>
                            <Icon name="warning" size={24} intent="warning" />
                            <Paragraph typographyStyle="body-md" intent="warning">
                                <Translation
                                    id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
                                    values={{ apy: formatApyValue(apy) }}
                                />
                            </Paragraph>
                        </Row>
                    </Table.Cell>

                    <Table.Cell align="end">
                        <Button intent="brand" size="small" onClick={navigateToStaking}>
                            <Translation id="TR_EARN_UPDATE_PROVIDER" />
                        </Button>
                    </Table.Cell>
                </>
            )}
        </Table.Row>
    );
};
