import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    selectAccountClaimTransactions,
    selectAccountIsStakingActive,
    selectPoolStatsApy,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getAccountTotalStakingBalance,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
    isPending,
} from '@suite-common/wallet-utils';
import { Card, Column, Icon, Paragraph, Row, Table } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { EarnStakingActionButtons } from './EarnStakingActionButtons';
import { EarnStakingCurrentRewards } from './EarnStakingCurrentRewards';
import { EarnStakingOutdatedProvider } from './EarnStakingOutdatedProvider';
import { EarnStakingPotentialRewards } from './EarnStakingPotentialRewards';
import { useStakingAccountStatus } from './hooks/useStakingAccountStatus';
import { EarnAccountCell } from '../common/EarnAccountCell';

export const EarnStakingAccountRow = ({
    account,
    isCardLayout,
}: {
    account: Account;
    isCardLayout: boolean;
}) => {
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBelowMobile } = useLayoutSize();
    const apy = useSelector(state => selectPoolStatsApy(state, { account }));
    const displaySymbol = getDisplaySymbol(account.symbol);
    const isCardanoNetworkType = account.networkType === 'cardano';
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const isClaimPending = useSelector(state =>
        selectAccountClaimTransactions(state, account.key).some(tx => isPending(tx)),
    );
    const { isStakingDisabled, stakingMessageContent, isClaimingDisabled, claimingMessageContent } =
        useMessageSystemStaking(account.symbol);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};
    const isClaimButtonDisabled = isClaimingDisabled || isClaimPending;

    const minStakingAmount = getStakingLimitsByNetworkSymbol(
        account.symbol,
    )?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

    const accountBalance = account.formattedBalance;
    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const stakingStatus = useStakingAccountStatus(account);

    const navigateToTradingBuy = (event: React.MouseEvent<HTMLButtonElement>) => {
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

    const navigateToStaking = (event?: React.MouseEvent) => {
        event?.stopPropagation();

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
                from: `dashboard/staking-dashboard/${stakingStatus}`,
                networkSymbol: account.symbol,
            },
        });
    };

    const openStakeModal = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (isStakingDisabled) {
            return;
        }

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
        dispatch(openModal({ type: 'stake', flow: EarnFlow.Stake, account }));

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const openClaimModal = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (isClaimButtonDisabled) {
            return;
        }

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
        dispatch(openModal({ type: 'claim', account }));

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
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

    const currentRewards = calculateRewards(stakingBalance, apy);
    const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
    const potentialRewards = calculateRewards(
        getNetworkAdjustedStakingBalance(totalBalance, account),
        apy,
    );
    const formattedStakingBalance = formatCryptoAmount(stakingBalance);
    const formattedAccountBalance = formatCryptoAmount(accountBalance);

    const currentRewardsProps = {
        symbol: account.symbol,
        rewards: currentRewards,
        apy,
        isStakingActive,
        formattedStakingBalance,
        displaySymbol,
    } as const;

    const potentialRewardsProps = {
        symbol: account.symbol,
        rewards: potentialRewards,
        apy,
        isCardanoNetworkType,
        formattedAccountBalance,
        displaySymbol,
    } as const;

    const minStakeParagraph = (
        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
            <Translation
                id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                values={{ amount: minStakingAmount?.toString(), displaySymbol }}
            />
        </Paragraph>
    );

    const maxStakeParagraph = (
        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
            <Translation id="TR_EARN_STAKING_DASHBOARD_MAXIMUM_STAKE" />
        </Paragraph>
    );

    const actionButtonsProps = {
        stakingStatus,
        isStakingDisabled,
        stakingMessageContent,
        canClaim,
        isClaimButtonDisabled,
        claimingMessageContent,
        onBuy: navigateToTradingBuy,
        onStake: openStakeModal,
        onStakeNow: navigateToStaking,
        onUpdateProvider: navigateToStaking,
        onClaim: openClaimModal,
    } as const;

    if (isCardLayout) {
        return (
            <Card paddingType="small" onClick={navigateToStaking}>
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        <EarnAccountCell account={account} />
                        <ApyValue
                            apy={stakingStatus === 'staking-outdated-provider' ? null : apy}
                        />
                    </Row>

                    {stakingStatus === 'insufficient-funds' && minStakeParagraph}

                    {stakingStatus === 'staking-outdated-provider' && (
                        <EarnStakingOutdatedProvider apy={apy} />
                    )}

                    {(stakingStatus === 'staking-active' || stakingStatus === 'staking-inactive') &&
                        (isBelowMobile ? (
                            <Column gap={4}>
                                <EarnStakingCurrentRewards {...currentRewardsProps} />
                                {apy && (
                                    <Icon
                                        name="arrowDown"
                                        intent="neutral"
                                        priority="secondary"
                                        size={20}
                                    />
                                )}
                                <EarnStakingPotentialRewards {...potentialRewardsProps} />
                            </Column>
                        ) : (
                            <Row alignItems="center">
                                <Column flex="2">
                                    <EarnStakingCurrentRewards {...currentRewardsProps} />
                                </Column>
                                {apy && (
                                    <Column flex="1" alignItems="center">
                                        <Icon
                                            name="arrowRight"
                                            intent="neutral"
                                            priority="secondary"
                                            size={20}
                                        />
                                    </Column>
                                )}
                                <Column flex="2">
                                    <EarnStakingPotentialRewards {...potentialRewardsProps} />
                                </Column>
                            </Row>
                        ))}

                    {stakingStatus === 'staking-max' &&
                        (isBelowMobile ? (
                            <Column gap={4}>
                                <EarnStakingCurrentRewards {...currentRewardsProps} />
                                {maxStakeParagraph}
                            </Column>
                        ) : (
                            <Row gap={16} alignItems="center">
                                <Column flex="1">
                                    <EarnStakingCurrentRewards {...currentRewardsProps} />
                                </Column>
                                <Column flex="1">{maxStakeParagraph}</Column>
                            </Row>
                        ))}

                    {stakingStatus === 'staked-but-insufficient-funds' &&
                        (isBelowMobile ? (
                            <Column gap={4}>
                                <EarnStakingCurrentRewards {...currentRewardsProps} />
                                {minStakeParagraph}
                            </Column>
                        ) : (
                            <Row gap={16} alignItems="center">
                                <Column flex="1">
                                    <EarnStakingCurrentRewards {...currentRewardsProps} />
                                </Column>
                                <Column flex="1">{minStakeParagraph}</Column>
                            </Row>
                        ))}

                    <Row gap={8}>
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Row>
                </Column>
            </Card>
        );
    }

    return (
        <Table.Row onClick={navigateToStaking}>
            <Table.Cell>
                <EarnAccountCell account={account} />
            </Table.Cell>

            <Table.Cell>
                {stakingStatus === 'staking-outdated-provider' ? (
                    <Translation id="TR_EARN_NOT_AVAILABLE" />
                ) : (
                    <ApyValue apy={apy} />
                )}
            </Table.Cell>

            {stakingStatus === 'insufficient-funds' && (
                <>
                    <Table.Cell colSpan={2}>{minStakeParagraph}</Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}

            {(stakingStatus === 'staking-active' || stakingStatus === 'staking-inactive') && (
                <>
                    <Table.Cell>
                        <Row width="100%" alignItems="center" justifyContent="space-between">
                            <EarnStakingCurrentRewards {...currentRewardsProps} />
                            {apy && (
                                <Icon
                                    name="arrowRight"
                                    intent="neutral"
                                    priority="secondary"
                                    size={20}
                                />
                            )}
                        </Row>
                    </Table.Cell>
                    <Table.Cell>
                        <EarnStakingPotentialRewards {...potentialRewardsProps} />
                    </Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}

            {stakingStatus === 'staking-max' && (
                <>
                    <Table.Cell>
                        <Row width="100%" alignItems="center" justifyContent="space-between">
                            <EarnStakingCurrentRewards {...currentRewardsProps} />
                        </Row>
                    </Table.Cell>
                    <Table.Cell>{maxStakeParagraph}</Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}

            {stakingStatus === 'staked-but-insufficient-funds' && (
                <>
                    <Table.Cell>
                        <Row width="100%" alignItems="center" justifyContent="space-between">
                            <EarnStakingCurrentRewards {...currentRewardsProps} />
                        </Row>
                    </Table.Cell>
                    <Table.Cell>{minStakeParagraph}</Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}

            {stakingStatus === 'staking-outdated-provider' && (
                <>
                    <Table.Cell colSpan={2}>
                        <EarnStakingOutdatedProvider apy={apy} />
                    </Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}
        </Table.Row>
    );
};
