import { useEffect, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { isStablecoinYieldSupported, selectSelectedDevice } from '@suite-common/device';
import { useFormatters } from '@suite-common/formatters';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import {
    getTradingPrefilledFromAccountData,
    toTokenCryptoId,
    tradingActions,
} from '@suite-common/trading';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { Card, Column, Icon, Row, Table } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { EarnYieldActionButtons } from './EarnYieldActionButtons';
import { EarnYieldApyTooltip } from './EarnYieldApyTooltip';
import { EarnYieldPotentialRewards } from './EarnYieldPotentialRewards';
import { EarnYieldYearlyRewards } from './EarnYieldYearlyRewards';
import { type YieldAccountOpportunity } from './types';
import { getEarnRouteParams } from '../../utils/getEarnRouteParams';
import { EarnAccountCell } from '../common/EarnAccountCell';

type EarnYieldAccountOpportunityProps = {
    opportunity: YieldAccountOpportunity;
    isCardLayout: boolean;
};

export const EarnYieldAccountOpportunity = ({
    opportunity,
    isCardLayout,
}: EarnYieldAccountOpportunityProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { CryptoAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const [isAwaitingConnectionForFwUpdate, setIsAwaitingConnectionForFwUpdate] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const isFirmwareOutdated = !isStablecoinYieldSupported(selectedDevice);

    useEffect(() => {
        if (isAwaitingConnectionForFwUpdate && !isConnectionModalOpen) {
            setIsAwaitingConnectionForFwUpdate(false);
            if (selectedDevice?.connected) {
                setIsFirmwareModalOpen(false);
                dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
            }
        }
    }, [
        isAwaitingConnectionForFwUpdate,
        isConnectionModalOpen,
        selectedDevice?.connected,
        dispatch,
    ]);

    const handleFirmwareModalClose = () => {
        setIsFirmwareModalOpen(false);
        setIsAwaitingConnectionForFwUpdate(false);
    };

    const handleFirmwareUpdate = () => {
        if (!selectedDevice?.connected) {
            if (selectedDevice?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            setIsAwaitingConnectionForFwUpdate(true);
            dispatch(setConnectionModal(true));

            return;
        }

        setIsFirmwareModalOpen(false);
        dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
    };

    const vaultContractAddress = getYieldVaultContractAddress(opportunity.vault);
    const depositMessageSystem = useMessageSystemYield('deposit', { vaultContractAddress });
    const withdrawMessageSystem = useMessageSystemYield('withdraw', { vaultContractAddress });

    const hasDepositedBalance = opportunity.hasVaultPosition;
    const hasDisplayableDepositedAmount = new BigNumber(opportunity.depositedAmount).gt(0);
    const hasAdditionalDepositAmount = new BigNumber(opportunity.additionalDepositAmount).gt(0);
    const { hasRewardsData } = opportunity;
    const hasApy = opportunity.apyPercentage !== null && opportunity.apyPercentage > 0;
    const yearlyRewards = hasDisplayableDepositedAmount
        ? new BigNumber(opportunity.depositedAmount)
              .times(opportunity.vault.rewardRate.total)
              .toString()
        : '0';
    const potentialRewards = hasRewardsData
        ? new BigNumber(opportunity.depositedAmount)
              .plus(opportunity.additionalDepositAmount)
              .times(opportunity.vault.rewardRate.total)
              .toString()
        : '0';
    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);
    const hasMaximumDeposited = hasDepositedBalance && !hasAdditionalDepositAmount;
    const shouldSpanRewardsCells = !hasApy && !hasPotentialRewards && !hasMaximumDeposited;
    const formattedDepositedAmount = CryptoAmountFormatter.format(opportunity.depositedAmount, {
        symbol: opportunity.depositedSymbol,
        withSymbol: false,
        isBalance: true,
    });
    const formattedAdditionalDepositAmount = CryptoAmountFormatter.format(
        opportunity.additionalDepositAmount,
        {
            symbol: opportunity.depositedSymbol,
            withSymbol: false,
            isBalance: true,
        },
    );

    const navigateToTradingBuy = () => {
        const networkSymbol = opportunity.account?.symbol ?? opportunity.networkSymbol;
        const accountIndex = opportunity.account?.index ?? 0;
        const accountType = opportunity.account?.accountType ?? 'normal';
        const tokenAddress = opportunity.vault.token.address;

        if (opportunity.account) {
            const tokenCryptoId = tokenAddress
                ? toTokenCryptoId(
                      networkSymbol,
                      getContractAddressForNetworkSymbol(networkSymbol, tokenAddress),
                  )
                : undefined;

            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(opportunity.account, tokenCryptoId),
                ),
            );
        }

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'earn-dashboard',
                networkSymbol,
                contractAddress: tokenAddress ?? undefined,
            },
        });

        dispatch(
            goto({
                routeName: 'wallet-trading-buy',
                params: {
                    symbol: networkSymbol,
                    accountIndex,
                    accountType,
                },
            }),
        );
    };

    const openYieldDepositFlow = () => {
        if (!opportunity.account) {
            return;
        }

        if (isFirmwareOutdated) {
            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: opportunity.account.symbol,
                    vaultId: opportunity.vault.id,
                },
            });
            setIsFirmwareModalOpen(true);

            return;
        }

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: opportunity.account.symbol,
                vaultId: opportunity.vault.id,
            },
        });

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Yield,
                provider: EarnProvider.Morpho,
                account: opportunity.account,
                analyticsStep: 'earn-dashboard',
                yieldContext: {
                    id: opportunity.vault.id,
                    tokenContractAddress: opportunity.vault.token.address ?? undefined,
                },
            }),
        );
    };

    const navigateToYieldDeposit = () => {
        if (!opportunity.account) {
            return;
        }

        if (isFirmwareOutdated) {
            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: opportunity.account.symbol,
                    vaultId: opportunity.vault.id,
                },
            });
            setIsFirmwareModalOpen(true);

            return;
        }

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'deposit-form',
                networkSymbol: opportunity.account.symbol,
                vaultId: opportunity.vault.id,
            },
        });

        dispatch(
            goto({
                routeName: 'earn-yield-deposit',
                params: getEarnRouteParams({
                    account: opportunity.account,
                    yieldId: opportunity.vault.id,
                    contractAddress: opportunity.vault.token.address ?? undefined,
                }),
            }),
        );
    };

    const navigateToYieldWithdraw = () => {
        if (!opportunity.account) {
            return;
        }

        if (isFirmwareOutdated) {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: opportunity.account.symbol,
                    vaultId: opportunity.vault.id,
                },
            });
            setIsFirmwareModalOpen(true);

            return;
        }

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'withdraw-form',
                networkSymbol: opportunity.account.symbol,
                vaultId: opportunity.vault.id,
            },
        });

        dispatch(
            goto({
                routeName: 'earn-yield-withdraw',
                params: getEarnRouteParams({
                    account: opportunity.account,
                    yieldId: opportunity.vault.id,
                    contractAddress: opportunity.vault.token.address ?? undefined,
                }),
            }),
        );
    };

    const isDepositDisabled = depositMessageSystem.isDisabled;
    const isWithdrawDisabled = withdrawMessageSystem.isDisabled;
    const isDepositNowDisabled = !opportunity.vault.status.enter || isDepositDisabled;
    const isDepositMoreDisabled =
        !opportunity.vault.status.enter || !hasAdditionalDepositAmount || isDepositDisabled;

    const firmwareModal = isFirmwareModalOpen && (
        <FirmwareUpgradeNeededModal
            onClose={handleFirmwareModalClose}
            onUpdate={handleFirmwareUpdate}
            featureName={translationString('TR_EARN_STABLECOIN_YIELD_TITLE')}
        />
    );

    const yearlyRewardsProps = {
        symbol: opportunity.depositedSymbol,
        rewards: yearlyRewards,
        apy: opportunity.apyPercentage,
        hasDisplayableDepositedAmount,
        formattedDepositedAmount,
        displaySymbol: opportunity.depositedSymbol,
    } as const;

    const potentialRewardsProps = {
        hasMaximumDeposited,
        hasPotentialRewards,
        symbol: opportunity.depositedSymbol,
        rewards: potentialRewards,
        apy: opportunity.apyPercentage,
        formattedAdditionalDepositAmount,
        displaySymbol: opportunity.depositedSymbol,
    } as const;

    const actionButtonsProps = {
        hasDepositedBalance,
        hasAdditionalDepositAmount,
        isDepositMoreDisabled,
        isDepositDisabled,
        isDepositNowDisabled,
        isWithdrawDisabled,
        depositMessageContent: depositMessageSystem.content,
        withdrawMessageContent: withdrawMessageSystem.content,
        onDepositMore: navigateToYieldDeposit,
        onWithdraw: navigateToYieldWithdraw,
        onDepositNow: openYieldDepositFlow,
        onBuy: navigateToTradingBuy,
    } as const;

    const accountCell = (
        <EarnAccountCell
            account={opportunity.account}
            symbol={opportunity.networkSymbol}
            iconToken={opportunity.vault.token}
            showAssetNetworkIcon
            subtitle={opportunity.vault.outputToken?.name ?? ''}
            tokenBalance={{
                value: opportunity.additionalDepositAmount,
                symbol: opportunity.depositedSymbol,
                contractAddress: opportunity.depositedContractAddress,
            }}
        />
    );

    const apyCell = (
        <EarnYieldApyTooltip
            vault={opportunity.vault}
            apyPercentage={opportunity.apyPercentage}
            networkSymbol={opportunity.networkSymbol}
        />
    );

    if (isCardLayout) {
        return (
            <>
                {firmwareModal}
                <Card paddingType="small">
                    <Column gap={12} width="100%">
                        <Row justifyContent="space-between" alignItems="flex-start">
                            {accountCell}
                            {apyCell}
                        </Row>

                        {hasRewardsData &&
                            (isBelowMobile ? (
                                <Column gap={4}>
                                    <EarnYieldYearlyRewards {...yearlyRewardsProps} />

                                    {!shouldSpanRewardsCells && (
                                        <>
                                            {hasApy && (
                                                <Icon
                                                    name="arrowDown"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    size={20}
                                                />
                                            )}
                                            <EarnYieldPotentialRewards {...potentialRewardsProps} />
                                        </>
                                    )}
                                </Column>
                            ) : (
                                <Row alignItems="center">
                                    <Column flex="2">
                                        <EarnYieldYearlyRewards {...yearlyRewardsProps} />
                                    </Column>

                                    {!shouldSpanRewardsCells && (
                                        <>
                                            {hasApy && (
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
                                                <EarnYieldPotentialRewards
                                                    {...potentialRewardsProps}
                                                />
                                            </Column>
                                        </>
                                    )}
                                </Row>
                            ))}

                        <Row gap={8}>
                            <EarnYieldActionButtons {...actionButtonsProps} />
                        </Row>
                    </Column>
                </Card>
            </>
        );
    }

    return (
        <>
            {firmwareModal}
            <Table.Row>
                <Table.Cell>{accountCell}</Table.Cell>

                <Table.Cell>{apyCell}</Table.Cell>

                {hasRewardsData ? (
                    <>
                        <Table.Cell colSpan={shouldSpanRewardsCells ? 2 : undefined}>
                            <Row width="100%" alignItems="center" justifyContent="space-between">
                                <EarnYieldYearlyRewards {...yearlyRewardsProps} />

                                {hasApy && (
                                    <Icon
                                        name="arrowRight"
                                        intent="neutral"
                                        priority="secondary"
                                        size={20}
                                    />
                                )}
                            </Row>
                        </Table.Cell>

                        {!shouldSpanRewardsCells && (
                            <Table.Cell>
                                <EarnYieldPotentialRewards {...potentialRewardsProps} />
                            </Table.Cell>
                        )}
                    </>
                ) : (
                    <Table.Cell colSpan={2} />
                )}

                <Table.Cell align="end">
                    <Row justifyContent="flex-end" gap={8}>
                        <EarnYieldActionButtons {...actionButtonsProps} />
                    </Row>
                </Table.Cell>
            </Table.Row>
        </>
    );
};
