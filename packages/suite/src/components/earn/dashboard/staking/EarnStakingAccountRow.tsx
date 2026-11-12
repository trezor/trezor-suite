import { events, injectDesktopAnalytics } from '@suite/analytics';
import { AssetSymbol } from '@suite/assets';
import { Translation, type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import {
    TRON_UNLOCKS_REFRESH_INTERVAL_MS,
    formatStakingAmount,
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingOperationPending,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountAmount,
    settleTronUnlocks,
    useNetworkStakingRate,
    useStakingAccess,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type StakingOperation, getStakingEarningAmount } from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { calculateRewards } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, Icon, Paragraph, Row, Table, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowDownIcon, ArrowRightIcon } from '@trezor/icons';
import { useNow } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnStakingActionButtons } from './EarnStakingActionButtons';
import { EarnStakingCurrentRewards } from './EarnStakingCurrentRewards';
import { EarnStakingOutdatedProvider } from './EarnStakingOutdatedProvider';
import { EarnStakingPotentialRewards } from './EarnStakingPotentialRewards';
import { EarnStakingRateTooltip } from './EarnStakingRateTooltip';
import { EarnStakingRemainingVotes } from './EarnStakingRemainingVotes';
import { getEarnStakingPotentialRewards } from './getEarnStakingPotentialRewards';
import { EarnAccountCell } from '../common/EarnAccountCell';
import { useStakingAccountStatus } from './hooks/useStakingAccountStatus';

type TronEarnFlow = 'stake' | 'vote' | 'withdraw';

type TronEarnFlowConfig = {
    routeName: 'earn-tron-stake' | 'earn-tron-vote' | 'earn-tron-withdraw';
    eventType:
        | typeof events.stakingStakeEvent.name
        | typeof events.stakingUnstakeEvent.name
        | typeof events.stakingUpdateProviderEvent.name;
    /** Names the flow in the firmware prompt. */
    featureName: TranslationKey;
};

const TRON_EARN_FLOWS: Record<TronEarnFlow, TronEarnFlowConfig> = {
    stake: {
        routeName: 'earn-tron-stake',
        eventType: events.stakingStakeEvent.name,
        featureName: 'TR_EARN_TRON_STAKE_TITLE',
    },
    vote: {
        routeName: 'earn-tron-vote',
        eventType: events.stakingUpdateProviderEvent.name,
        featureName: 'TR_EARN_TRON_VOTE',
    },
    withdraw: {
        routeName: 'earn-tron-withdraw',
        eventType: events.stakingUnstakeEvent.name,
        featureName: 'TR_EARN_TRON_WITHDRAW_TITLE',
    },
};

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
    const isTronNetworkType = account.networkType === 'tron';

    const { productId, descriptor, position, totals, access } = useStakingAccountPosition(
        account.key,
    );

    const voteCount =
        position?.details?.kind === 'tron-staking'
            ? formatStakingAmount({
                  amount: position.details.unallocatedVotingPower,
                  networkSymbol: account.symbol,
              })
            : '0';

    const stakeableDescriptor = useSelector(state =>
        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol),
    );
    const stakeableAccess = useStakingAccess(stakeableDescriptor?.id ?? null);
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();
    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, account.key));
    const stakingAmount = useSelector(state => selectStakingAccountAmount(state, account.key));

    const isDrepDelegationRequired = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'missing-drep'),
    );

    // Ethereum and Solana pay out the unstaked principal here, Cardano its rewards and Tron its
    // unfrozen TRX; Tron claims its rewards on its own page.
    const claimOperation: StakingOperation =
        !isTronNetworkType && descriptor?.operations.includes('claim') ? 'claim' : 'withdraw';
    const isClaimPending = useSelector(state =>
        selectIsStakingOperationPending(state, account.key, claimOperation),
    );

    const { isDisabled: isStakingDisabled, message: stakingMessageContent } =
        useStakingOperationSwitch(stakeableDescriptor?.id ?? null, 'stake');
    const { isDisabled: isClaimingDisabled, message: claimingMessageContent } =
        useStakingOperationSwitch(productId, claimOperation);
    const { isDisabled: isVotingDisabled, message: votingMessageContent } =
        useStakingOperationSwitch(productId, 'vote');

    // A Tron unlock matures by time alone, so a Tron row settles it at the current minute; no
    // other row has a reason to tick.
    const nowMs = useNow(isTronNetworkType ? TRON_UNLOCKS_REFRESH_INTERVAL_MS : null);
    const withdrawableAmount =
        isTronNetworkType && position !== null
            ? settleTronUnlocks({ position, nowMs }).withdrawable
            : totals.withdrawable;
    const claimableAmount = claimOperation === 'claim' ? totals.rewards : withdrawableAmount;
    const canClaim = new BigNumber(claimableAmount).gt(0);

    // The position withholds the Cardano claim while any transaction is pending and the Ethereum
    // withdrawal while one is; the settled Tron amount is the row's own, so Tron asks the position
    // nothing.
    const isClaimOffered = position?.operations.includes(claimOperation) ?? false;
    const isClaimButtonDisabled =
        isClaimingDisabled ||
        isClaimPending ||
        (!isTronNetworkType && !isClaimOffered) ||
        isDrepDelegationRequired;

    // A disabled claim says why: the switch, the DRep, a pending claim, or the pending transaction
    // that withholds the operation.
    const getClaimTooltipContent = () => {
        if (claimingMessageContent) return claimingMessageContent;
        if (isDrepDelegationRequired) return <Translation id="TR_STAKE_DREP_DELEGATION_REQUIRED" />;
        if (isClaimPending) return <Translation id="TR_STAKE_CLAIM_PENDING" />;
        if (!isTronNetworkType && !isClaimOffered) {
            return <Translation id="TR_STAKE_CLAIM_TRANSACTION_PENDING" />;
        }

        return undefined;
    };

    const claimTooltipContent = getClaimTooltipContent();

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

    // The rate applies to the staked and pending amounts; the Staked line and the fiat sort keep
    // the whole position, the unfreeze queue of a Tron account included.
    const earningBalance = formatStakingAmount({
        amount: getStakingEarningAmount(totals),
        networkSymbol: account.symbol,
    });
    const currentRewards = calculateRewards(earningBalance, rate);

    const potentialRewards = getEarnStakingPotentialRewards({
        currentRewards,
        availableBalance: account.availableBalance,
        limits: stakeableDescriptor?.limits ?? null,
        rate,
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

    // A first stake is gated on the product the network stakes on, the other flows on the
    // position's product.
    const tronFlowAccess = { stake: stakeableAccess, vote: access, withdraw: access };

    // A Tron flow that firmware withholds stays reachable and asks for the update instead, as on
    // the account's staking tab.
    const openTronFlow = (event: React.MouseEvent<HTMLButtonElement>, flow: TronEarnFlow) => {
        event.stopPropagation();

        const { routeName, eventType, featureName } = TRON_EARN_FLOWS[flow];

        if (tronFlowAccess[flow].disabled[flow]?.kind === 'firmware') {
            openFirmwareModal(featureName);

            return;
        }

        dispatch(
            gotoThunk({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: eventType,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const onTronStake = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isStakingDisabled) {
            return;
        }

        openTronFlow(event, 'stake');
    };

    const onTronVote = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isVotingDisabled) {
            return;
        }

        openTronFlow(event, 'vote');
    };

    const onTronWithdraw = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isClaimButtonDisabled) {
            return;
        }

        openTronFlow(event, 'withdraw');
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
        onStake: isTronNetworkType ? onTronStake : openStakeModal,
        onStakeNow: isTronNetworkType ? onTronStake : navigateToStaking,
        onUpdateProvider: navigateToStaking,
        onVote: onTronVote,
        onClaim: isTronNetworkType ? onTronWithdraw : openClaimModal,
    } as const;

    // The prompt sits outside the clickable card and row, or its clicks would bubble into them.
    if (isCardLayout) {
        return (
            <>
                {firmwareModal}

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
                            <EarnStakingOutdatedProvider apy={newProviderApy} account={account} />
                        )}

                        {stakingStatus === 'staking-remaining-votes' && (
                            <EarnStakingRemainingVotes apr={rate} count={voteCount} />
                        )}

                        {(stakingStatus === 'staking-active' ||
                            stakingStatus === 'staking-inactive') &&
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
            </>
        );
    }

    return (
        <>
            {firmwareModal}

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
                            <EarnStakingOutdatedProvider apy={newProviderApy} account={account} />
                        </Table.Cell>
                        <Table.Cell align="end">
                            <EarnStakingActionButtons {...actionButtonsProps} />
                        </Table.Cell>
                    </>
                )}

                {stakingStatus === 'staking-remaining-votes' && (
                    <>
                        <Table.Cell colSpan={2}>
                            <EarnStakingRemainingVotes apr={rate} count={voteCount} />
                        </Table.Cell>
                        <Table.Cell align="end">
                            <EarnStakingActionButtons {...actionButtonsProps} />
                        </Table.Cell>
                    </>
                )}
            </Table.Row>
        </>
    );
};
