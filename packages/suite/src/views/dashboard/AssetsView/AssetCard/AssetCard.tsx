import React from 'react';
import { useDispatch } from 'react-redux';

import styled, { useTheme } from 'styled-components';

import { AssetFiatBalance } from '@suite-common/assets';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { Network } from '@suite-common/wallet-config';
import { selectAnyAccountIsStakingActive } from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import {
    Card,
    Column,
    H2,
    Icon,
    InfoItem,
    Row,
    SkeletonRectangle,
    variables,
} from '@trezor/components';
import { TokenInfo } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';

import { AssetCardInfo, AssetCardInfoSkeleton } from './AssetCardInfo';
import { AssetCardTokensAndStakingInfo } from './AssetCardTokensAndStakingInfo';
import { TradingButton } from '../TradingButton';
import { handleTokensAndStakingData } from '../assetsViewUtils';

// eslint-disable-next-line local-rules/no-override-ds-component
const WarningIcon = styled(Icon)`
    padding-left: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};
`;

const FiatAmount = styled.div`
    display: flex;
    align-content: flex-end;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const IntegerValue = styled(H2)`
    font-variant-numeric: tabular-nums;
    line-height: 34px;
    letter-spacing: 0.565px;
`;

const CoinAmount = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    display: inline-block;
    margin-top: ${spacingsPx.xs};
    font-variant-numeric: tabular-nums;
    ${typography.hint};
`;

const FailedContainer = styled.div`
    color: ${({ theme }) => theme.textAlertRed};
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};

    ${typography.hint}
    ${variables.SCREEN_QUERY.MOBILE} {
        border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
    }
`;

type AssetCardProps = {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    assetsFiatBalances: AssetFiatBalance[];
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    index?: number;
    localCurrency: FiatCurrencyCode;
    currentFiatRates?: RatesByKey;
    accounts: Account[];
    isStakeNetwork?: boolean;
};

export const AssetCard = ({
    network,
    failed,
    cryptoValue,
    assetsFiatBalances,
    stakingAccounts,
    assetTokens,
    index,
    localCurrency,
    currentFiatRates,
    accounts,
    isStakeNetwork,
}: AssetCardProps) => {
    const { symbol } = network;
    const dispatch = useDispatch();
    const theme = useTheme();
    const handleCardClick = () => {
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                },
            }),
        );
    };

    const stakingAccountsForAsset = stakingAccounts.filter(account => account.symbol === symbol);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const isStakingActive = useSelector(state =>
        selectAnyAccountIsStakingActive(state, stakingAccountsForAsset),
    );

    const { tokensFiatBalance, assetStakingBalance, shouldRenderStakingRow, shouldRenderTokenRow } =
        handleTokensAndStakingData(
            assetTokens,
            stakingAccountsForAsset,
            isStakingActive,
            symbol,
            localCurrency,
            coinDefinitions,
            currentFiatRates,
        );

    const onStakeButtonClick = () => {
        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'navigate',
                from: 'dashboard/assets',
                networkSymbol: symbol,
            },
        });
    };

    return (
        <Card
            paddingType="small"
            onClick={handleCardClick}
            data-testid={`@dashboard/asset-item/${symbol}`}
        >
            <Column justifyContent="space-between" height="100%">
                <Column gap={spacings.xxxl} flex="1" margin={spacings.xs}>
                    <Row justifyContent="space-between">
                        <AssetCardInfo
                            network={network}
                            assetsFiatBalances={assetsFiatBalances}
                            index={index}
                        />
                        <Icon size={16} name="arrowRight" variant="disabled" />
                    </Row>
                    {!failed ? (
                        <Column>
                            <FiatAmount data-testid={`@dashboard/asset/${symbol}/fiat-amount`}>
                                <FiatHeader
                                    symbol={symbol}
                                    amount={cryptoValue}
                                    size="medium"
                                    localCurrency={localCurrency}
                                />
                            </FiatAmount>
                            <CoinAmount>
                                <AmountUnitSwitchWrapper symbol={symbol}>
                                    <CoinBalance value={cryptoValue} symbol={symbol} />
                                </AmountUnitSwitchWrapper>
                            </CoinAmount>
                        </Column>
                    ) : (
                        <FailedContainer>
                            <WarningIcon name="warning" color={theme.legacy.TYPE_RED} size={14} />
                            <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                        </FailedContainer>
                    )}
                </Column>
                {(shouldRenderStakingRow || shouldRenderTokenRow) && (
                    <AssetCardTokensAndStakingInfo
                        symbol={symbol}
                        tokensFiatBalance={tokensFiatBalance.toString()}
                        assetStakingBalance={assetStakingBalance.toString()}
                        shouldRenderStaking={shouldRenderStakingRow}
                        shouldRenderTokens={shouldRenderTokenRow}
                        accounts={accounts}
                    />
                )}
                {!isTestnet(symbol) && (
                    <Card data-testid="@dashboard/asset/bottom-info">
                        <Row justifyContent="space-between" flexWrap="wrap" gap={spacings.md}>
                            <InfoItem
                                data-testid="@dashboard/asset/exchange-rate"
                                label={<Translation id="TR_EXCHANGE_RATE" />}
                                flex="0"
                            >
                                <PriceTicker symbol={symbol} />
                            </InfoItem>
                            <InfoItem
                                data-testid="@dashboard/asset/week-change"
                                label={<Translation id="TR_7D_CHANGE" />}
                                flex="0"
                            >
                                <TrendTicker symbol={symbol} />
                            </InfoItem>

                            <Row gap={spacings.xs}>
                                {isStakeNetwork && (
                                    <TradingButton
                                        symbol={symbol}
                                        onClick={onStakeButtonClick}
                                        routeName="wallet-staking"
                                    >
                                        <Translation id="TR_STAKE_STAKE" />
                                    </TradingButton>
                                )}

                                <TradingButton
                                    symbol={symbol}
                                    routeName="wallet-trading-buy"
                                    data-testid={`@dashboard/asset/${symbol}/buy-button`}
                                    onClick={() => {
                                        analytics.report({
                                            type: EventType.AccountsDashboardBuy,
                                            payload: { symbol },
                                        });
                                    }}
                                >
                                    <Translation id="TR_BUY_BUY" />
                                </TradingButton>
                            </Row>
                        </Row>
                    </Card>
                )}
            </Column>
        </Card>
    );
};

export const AssetCardSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <Card>
            <Column gap={spacings.xxxl} flex="1" margin={spacings.xs}>
                <Row justifyContent="space-between">
                    <AssetCardInfoSkeleton animate={animate} />
                </Row>
                <Column>
                    <FiatAmount>
                        <IntegerValue>
                            <SkeletonRectangle animate={animate} width={95} height={32} />
                        </IntegerValue>
                    </FiatAmount>
                    <CoinAmount>
                        <SkeletonRectangle animate={animate} width={50} height={16} />
                    </CoinAmount>
                </Column>
            </Column>
            <Card>
                <SkeletonRectangle animate={animate} width="100%" height={40} />
            </Card>
        </Card>
    );
};
