import { events, injectDesktopAnalytics } from '@suite/analytics';
import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import {
    formatStakingAmount,
    getPotentialStakingRewards,
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingOperationPending,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountAmount,
    useNetworkStakingRate,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type StakingOperation } from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { calculateRewards } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, Icon, Paragraph, Row, Table, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowDownIcon, ArrowRightIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnStakingActionButtons } from './EarnStakingActionButtons';
import { EarnStakingCurrentRewards } from './EarnStakingCurrentRewards';
import { EarnStakingOutdatedProvider } from './EarnStakingOutdatedProvider';
import { EarnStakingPotentialRewards } from './EarnStakingPotentialRewards';
import { EarnStakingRateTooltip } from './EarnStakingRateTooltip';
import { EarnStakingRemainingVotes } from './EarnStakingRemainingVotes';
import { EarnAccountCell } from '../common/EarnAccountCell';
import { useStakingAccountStatus } from './hooks/useStakingAccountStatus';

interface EarnStakingAccountRowProps {
    account: Account;
    isCardLayout: boolean;
}

export const EarnStakingAccountRow = ({ account, isCardLayout }: EarnStakingAccountRowProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { isBelowMobile } = useLayoutSize();

    const { rate, rateKind } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    // Promoted (best) pool APY, shown when suggesting a switch to a new provider.
    const { rate: newProviderApy } = useNetworkStakingRate({ networkSymbol: account.symbol });

    const isCardanoNetworkType = account.networkType === 'cardano';

    const { productId, descriptor, totals } = useStakingAccountPosition(account.key);

    const stakeableDescriptor = useSelector(state =>
        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol),
    );
    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, account.key));
    const stakingAmount = useSelector(state => selectStakingAccountAmount(state, account.key));

    const isDrepDelegationRequired = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'missing-drep'),
    );

    // Ethereum and Solana pay out the unstaked principal here, Cardano its rewards.
    const claimOperation: StakingOperation = descriptor?.operations.includes('claim')
        ? 'claim'
        : 'withdraw';
    const isClaimPending = useSelector(state =>
        selectIsStakingOperationPending(state, account.key, claimOperation),
    );

    const { isDisabled: isStakingDisabled, message: stakingMessageContent } =
        useStakingOperationSwitch(stakeableDescriptor?.id ?? null, 'stake');
    const { isDisabled: isClaimingDisabled, message: claimingMessageContent } =
        useStakingOperationSwitch(productId, claimOperation);
    const { isDisabled: isVotingDisabled, message: votingMessageContent } =
        useStakingOperationSwitch(productId, 'vote');

    // The claim modal serves Ethereum, Solana and Cardano; Tron claims on its own page.
    const claimableAmount = claimOperation === 'claim' ? totals.rewards : totals.withdrawable;
    const canClaim = account.networkType !== 'tron' && new BigNumber(claimableAmount).gt(0);
    const isClaimButtonDisabled = isClaimingDisabled || isClaimPending || isDrepDelegationRequired;

    const claimTooltipContent =
        claimingMessageContent ??
        (isDrepDelegationRequired ? (
            <Translation id="TR_STAKE_DREP_DELEGATION_REQUIRED" />
        ) : undefined);

    const minStakingAmount =
        stakeableDescriptor === null
            ? undefined
            : formatStakingAmount({
                  amount: stakeableDescriptor.limits.minStakeAmountForDashboard,
                  networkSymbol: account.symbol,
              });

    const accountBalance = account.formattedBalance;

    const stakingBalance = formatStakingAmount({
        amount: stakingAmount,
        networkSymbol: account.symbol,
    });

    const stakingStatus = useStakingAccountStatus(account);

    const navigateToTradingBuy = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account),
            ),
        );
        dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));

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
            gotoThunk({
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
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Stake,
                provider: EarnProvider.Everstake,
                account,
                analyticsStep: 'staking-dashboard',
            }),
        );
    };

    const openClaimModal = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (isClaimButtonDisabled) {
            return;
        }

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
            formatStyle: 'compact-balance',
        });

    const currentRewards = calculateRewards(stakingBalance, rate);

    const potentialRewards = formatStakingAmount({
        amount: getPotentialStakingRewards({
            accounts: [{ availableBalance: account.availableBalance }],
            limits: stakeableDescriptor?.limits ?? null,
            rate,
        }),
        networkSymbol: account.symbol,
    });
    const formattedStakingBalance = formatCryptoAmount(stakingBalance);
    const formattedAccountBalance = formatCryptoAmount(accountBalance);

    const currentRewardsProps = {
        symbol: account.symbol,
        rewards: currentRewards,
        apy: rate,
        isStakingActive,
        formattedStakingBalance,
    } as const;

    const potentialRewardsProps = {
        symbol: account.symbol,
        rewards: potentialRewards,
        apy: rate,
        isCardanoNetworkType,
        formattedAccountBalance,
    } as const;

    const rowTestId = `@earn/dashboard/staking-account/${account.symbol}-${account.index}`;

    const minStakeParagraph = (
        <Paragraph
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            data-testid="@earn/dashboard/minimum-stake"
        >
            <Translation
                id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                values={{
                    amount: minStakingAmount ? formatCryptoAmount(minStakingAmount) : undefined,
                    displaySymbol: <AssetSymbol networkSymbol={account.symbol} />,
                }}
            />
        </Paragraph>
    );

    const maxStakeParagraph = (
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id="TR_EARN_STAKING_DASHBOARD_MAXIMUM_STAKE" />
        </Paragraph>
    );

    const onTronStake = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isStakingDisabled) {
            return;
        }

        event.stopPropagation();

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const onTronVote = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isVotingDisabled) {
            return;
        }

        event.stopPropagation();

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-vote',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: events.stakingUpdateProviderEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const apyAvailable =
        stakingStatus !== 'staking-outdated-provider' &&
        stakingStatus !== 'staking-remaining-votes';

    const actionButtonsProps = {
        stakingStatus,
        isStakingDisabled,
        stakingMessageContent,
        isVotingDisabled,
        votingMessageContent,
        canClaim,
        networkType: account.networkType,
        isClaimButtonDisabled,
        claimingMessageContent: claimTooltipContent,
        onBuy: navigateToTradingBuy,
        onStake: account.symbol === 'trx' ? onTronStake : openStakeModal,
        onStakeNow: account.symbol === 'trx' ? onTronStake : navigateToStaking,
        onUpdateProvider: navigateToStaking,
        onVote: onTronVote,
        onClaim: openClaimModal,
    } as const;

    if (isCardLayout) {
        return (
            <Card paddingType="small" onClick={navigateToStaking} data-testid={rowTestId}>
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        <EarnAccountCell account={account} />

                        {apyAvailable ? (
                            <EarnStakingRateTooltip rateKind={rateKind} rate={rate} />
                        ) : (
                            <Text typographyStyle="body-sm">
                                <Translation id="TR_EARN_NOT_AVAILABLE" />
                            </Text>
                        )}
                    </Row>

                    {stakingStatus === 'insufficient-funds' && minStakeParagraph}

                    {stakingStatus === 'staking-outdated-provider' && (
                        <EarnStakingOutdatedProvider apy={newProviderApy} />
                    )}

                    {stakingStatus === 'staking-remaining-votes' && (
                        <EarnStakingRemainingVotes apr={rate} />
                    )}

                    {(stakingStatus === 'staking-active' || stakingStatus === 'staking-inactive') &&
                        (isBelowMobile ? (
                            <Column gap={4}>
                                <EarnStakingCurrentRewards {...currentRewardsProps} />
                                {rate && (
                                    <Icon
                                        as={ArrowDownIcon}
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
                                {rate && (
                                    <Column flex="1" alignItems="center">
                                        <Icon
                                            as={ArrowRightIcon}
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
        <Table.Row onClick={navigateToStaking} data-testid={rowTestId}>
            <Table.Cell>
                <EarnAccountCell account={account} />
            </Table.Cell>

            <Table.Cell>
                {apyAvailable ? (
                    <EarnStakingRateTooltip rateKind={rateKind} rate={rate} />
                ) : (
                    <Text typographyStyle="body-sm">
                        <Translation id="TR_EARN_NOT_AVAILABLE" />
                    </Text>
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
                            {rate && (
                                <Icon
                                    as={ArrowRightIcon}
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
                        <EarnStakingOutdatedProvider apy={newProviderApy} />
                    </Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}

            {stakingStatus === 'staking-remaining-votes' && (
                <>
                    <Table.Cell colSpan={2}>
                        <EarnStakingRemainingVotes apr={rate} />
                    </Table.Cell>
                    <Table.Cell align="end">
                        <EarnStakingActionButtons {...actionButtonsProps} />
                    </Table.Cell>
                </>
            )}
        </Table.Row>
    );
};
