import { useState } from 'react';

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
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { Button, Column, Icon, Paragraph, Row, Table } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { FirmwareUpgradeNeededModal } from 'src/components/suite/modals/FirmwareUpgradeNeededModal';
import { useDispatch, useSelector } from 'src/hooks/suite';

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
    const { CryptoAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isFirmwareOutdated = !isStablecoinYieldSupported(selectedDevice);

    const hasSuppliedBalance = opportunity.hasVaultPosition;
    const hasDisplayableSuppliedAmount = new BigNumber(opportunity.suppliedAmount).gt(0);
    const hasMatchedTokenWithBalance = new BigNumber(opportunity.additionalSupplyAmount).gt(0);
    const hasRewardsData = hasMatchedTokenWithBalance || hasDisplayableSuppliedAmount;
    const hasApy = opportunity.apyPercentage !== null;
    const yearlyRewards = hasDisplayableSuppliedAmount
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
    const formattedSuppliedAmount = CryptoAmountFormatter.format(opportunity.suppliedAmount, {
        symbol: opportunity.suppliedSymbol,
        withSymbol: false,
        isBalance: true,
    });
    const formattedAdditionalSupplyAmount = CryptoAmountFormatter.format(
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

    const openYieldSupplyFlow = () => {
        if (!opportunity.account) {
            return;
        }

        if (isFirmwareOutdated) {
            setIsFirmwareModalOpen(true);

            return;
        }

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

    const navigateToYieldSupply = () => {
        if (!opportunity.account) {
            return;
        }

        if (isFirmwareOutdated) {
            setIsFirmwareModalOpen(true);

            return;
        }

        dispatch(
            goto({
                routeName: 'earn-supply',
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

    return (
        <>
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={() => setIsFirmwareModalOpen(false)}
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
                        subtitle={opportunity.vault.metadata.name}
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
                        <Table.Cell>
                            <Row width="100%" alignItems="center" justifyContent="space-between">
                                <Column>
                                    <EarnRewardsAmount
                                        symbol={opportunity.suppliedSymbol}
                                        rewards={yearlyRewards}
                                        apy={opportunity.apyPercentage}
                                    />

                                    {hasDisplayableSuppliedAmount && (
                                        <Paragraph
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <HiddenPlaceholder>
                                                <Translation
                                                    id="TR_EARN_YIELD_DASHBOARD_SUPPLIED"
                                                    values={{
                                                        amount: formattedSuppliedAmount,
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

                        <Table.Cell>
                            {hasPotentialRewards && (
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
                                                    amount: formattedAdditionalSupplyAmount,
                                                    displaySymbol: opportunity.suppliedSymbol,
                                                }}
                                            />
                                        </HiddenPlaceholder>
                                    </Paragraph>
                                </Column>
                            )}
                        </Table.Cell>
                    </>
                ) : (
                    <Table.Cell colSpan={2} />
                )}

                <Table.Cell align="end">
                    <Row justifyContent="flex-end" gap={8}>
                        {hasSuppliedBalance && (
                            <>
                                <Button size="small" onClick={navigateToYieldSupply}>
                                    <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_MORE" />
                                </Button>
                                <Button
                                    size="small"
                                    intent="brand"
                                    priority="secondary"
                                    onClick={navigateToYieldWithdraw}
                                >
                                    <Translation id="TR_EARN_YIELD_DASHBOARD_WITHDRAW" />
                                </Button>
                            </>
                        )}

                        {!hasSuppliedBalance && hasMatchedTokenWithBalance && (
                            <Button
                                size="small"
                                isDisabled={!opportunity.vault.status.enter}
                                onClick={openYieldSupplyFlow}
                            >
                                <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_NOW" />
                            </Button>
                        )}

                        {!hasSuppliedBalance && !hasMatchedTokenWithBalance && (
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
