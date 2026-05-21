import { useEffect, useRef, useState } from 'react';

import { events } from '@suite/analytics';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
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
import { Button, Column, Icon, Paragraph, Row, Table, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';
import { useAnalytics } from 'src/support/useAnalytics';

import { EarnYieldApyTooltip } from './EarnYieldApyTooltip';
import { type YieldAccountOpportunity } from './types';
import { getEarnRouteParams } from '../../utils/getEarnRouteParams';
import { EarnAccountCell } from '../common/EarnAccountCell';
import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldAccountOpportunityProps = {
    opportunity: YieldAccountOpportunity;
};

export const EarnYieldAccountOpportunity = ({ opportunity }: EarnYieldAccountOpportunityProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { CryptoAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const isAwaitingConnectionForFwUpdateRef = useRef(false);
    const wasConnectionModalOpenRef = useRef(isConnectionModalOpen);
    const isFirmwareOutdated = !isStablecoinYieldSupported(selectedDevice);

    useEffect(() => {
        const wasOpen = wasConnectionModalOpenRef.current;
        wasConnectionModalOpenRef.current = isConnectionModalOpen;

        if (!isAwaitingConnectionForFwUpdateRef.current) {
            return;
        }
        if (wasOpen && !isConnectionModalOpen) {
            isAwaitingConnectionForFwUpdateRef.current = false;
            if (selectedDevice?.connected) {
                setIsFirmwareModalOpen(false);
                dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
            }
        }
    }, [isConnectionModalOpen, selectedDevice?.connected, dispatch]);

    const handleFirmwareUpdate = () => {
        if (!selectedDevice?.connected) {
            if (selectedDevice?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            isAwaitingConnectionForFwUpdateRef.current = true;
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
    const hasDisplayableDepositedAmount = new BigNumber(opportunity.suppliedAmount).gt(0);
    const hasAdditionalDepositAmount = new BigNumber(opportunity.additionalSupplyAmount).gt(0);
    const { hasRewardsData } = opportunity;
    const hasApy = opportunity.apyPercentage !== null && opportunity.apyPercentage > 0;
    const yearlyRewards = hasDisplayableDepositedAmount
        ? new BigNumber(opportunity.suppliedAmount)
              .times(opportunity.vault.rewardRate.total)
              .toString()
        : '0';
    const potentialRewards = hasRewardsData
        ? new BigNumber(opportunity.suppliedAmount)
              .plus(opportunity.additionalSupplyAmount)
              .times(opportunity.vault.rewardRate.total)
              .toString()
        : '0';
    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);
    const hasMaximumDeposited = hasDepositedBalance && !hasAdditionalDepositAmount;
    const shouldSpanRewardsCells = !hasApy && !hasPotentialRewards && !hasMaximumDeposited;
    const formattedDepositedAmount = CryptoAmountFormatter.format(opportunity.suppliedAmount, {
        symbol: opportunity.suppliedSymbol,
        withSymbol: false,
        isBalance: true,
    });
    const formattedAdditionalDepositAmount = CryptoAmountFormatter.format(
        opportunity.additionalSupplyAmount,
        {
            symbol: opportunity.suppliedSymbol,
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
                contractAddress: opportunity.vault.token.address,
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
                contractAddress: opportunity.vault.token.address,
            },
        });

        dispatch(
            goto({
                routeName: 'earn-deposit',
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
                contractAddress: opportunity.vault.token.address,
            },
        });

        dispatch(
            goto({
                routeName: 'earn-withdraw',
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

    return (
        <>
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={() => setIsFirmwareModalOpen(false)}
                    onUpdate={handleFirmwareUpdate}
                    featureName={translationString('TR_EARN_STABLECOIN_YIELD_TITLE')}
                />
            )}
            <Table.Row>
                <Table.Cell>
                    <EarnAccountCell
                        account={opportunity.account}
                        symbol={opportunity.networkSymbol}
                        iconToken={opportunity.vault.token}
                        showAssetNetworkIcon
                        subtitle={opportunity.vault.outputToken?.name ?? ''}
                        tokenBalance={{
                            value: opportunity.additionalSupplyAmount,
                            symbol: opportunity.suppliedSymbol,
                            contractAddress: opportunity.suppliedContractAddress,
                        }}
                    />
                </Table.Cell>

                <Table.Cell>
                    <EarnYieldApyTooltip
                        vault={opportunity.vault}
                        apyPercentage={opportunity.apyPercentage}
                        networkSymbol={opportunity.networkSymbol}
                    />
                </Table.Cell>

                {hasRewardsData ? (
                    <>
                        <Table.Cell colSpan={shouldSpanRewardsCells ? 2 : undefined}>
                            <Row width="100%" alignItems="center" justifyContent="space-between">
                                <Column>
                                    <EarnRewardsAmount
                                        symbol={opportunity.suppliedSymbol}
                                        rewards={yearlyRewards}
                                        apy={opportunity.apyPercentage}
                                    />

                                    {hasDisplayableDepositedAmount && (
                                        <Paragraph
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <HiddenPlaceholder>
                                                <Translation
                                                    id="TR_EARN_YIELD_DASHBOARD_SUPPLIED"
                                                    values={{
                                                        amount: formattedDepositedAmount,
                                                        displaySymbol: opportunity.suppliedSymbol,
                                                    }}
                                                />
                                            </HiddenPlaceholder>
                                        </Paragraph>
                                    )}
                                </Column>

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
                                {hasMaximumDeposited ? (
                                    <Paragraph
                                        typographyStyle="body-md"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <Translation id="TR_EARN_YIELD_MAXIMUM_DEPOSITED" />
                                    </Paragraph>
                                ) : (
                                    hasPotentialRewards && (
                                        <Column>
                                            <EarnRewardsAmount
                                                symbol={opportunity.suppliedSymbol}
                                                rewards={potentialRewards}
                                                apy={opportunity.apyPercentage}
                                                intent="brand"
                                            />

                                            <Paragraph
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                            >
                                                <HiddenPlaceholder>
                                                    <Translation
                                                        id="TR_EARN_STAKING_DASHBOARD_IF_YOU_ADD"
                                                        values={{
                                                            amount: formattedAdditionalDepositAmount,
                                                            displaySymbol:
                                                                opportunity.suppliedSymbol,
                                                        }}
                                                    />
                                                </HiddenPlaceholder>
                                            </Paragraph>
                                        </Column>
                                    )
                                )}
                            </Table.Cell>
                        )}
                    </>
                ) : (
                    <Table.Cell colSpan={2} />
                )}

                <Table.Cell align="end">
                    <Row justifyContent="flex-end" gap={8}>
                        {hasDepositedBalance && (
                            <>
                                <Tooltip content={depositMessageSystem.content}>
                                    <Button
                                        size="small"
                                        isDisabled={isDepositMoreDisabled}
                                        iconLeft={isDepositDisabled ? 'info' : undefined}
                                        onClick={navigateToYieldDeposit}
                                    >
                                        <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_MORE" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={withdrawMessageSystem.content}>
                                    <Button
                                        size="small"
                                        intent="brand"
                                        priority="secondary"
                                        isDisabled={isWithdrawDisabled}
                                        iconLeft={isWithdrawDisabled ? 'info' : undefined}
                                        onClick={navigateToYieldWithdraw}
                                    >
                                        <Translation id="TR_EARN_YIELD_DASHBOARD_WITHDRAW" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}

                        {!hasDepositedBalance && hasAdditionalDepositAmount && (
                            <Tooltip content={depositMessageSystem.content}>
                                <Button
                                    size="small"
                                    isDisabled={isDepositNowDisabled}
                                    iconLeft={isDepositDisabled ? 'info' : undefined}
                                    onClick={openYieldDepositFlow}
                                >
                                    <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_NOW" />
                                </Button>
                            </Tooltip>
                        )}

                        {!hasDepositedBalance && !hasAdditionalDepositAmount && (
                            <Button
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={navigateToTradingBuy}
                            >
                                <Translation id="TR_BUY" />
                            </Button>
                        )}
                    </Row>
                </Table.Cell>
            </Table.Row>
        </>
    );
};
