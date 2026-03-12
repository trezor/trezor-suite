import React from 'react';
import { useDispatch } from 'react-redux';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { AssetFiatBalance } from '@suite-common/assets';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { selectAnyAccountIsStakingActive, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { AmountUnit } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import {
    Card,
    Column,
    Icon,
    InfoItem,
    Note,
    Row,
    SkeletonRectangle,
    Text,
} from '@trezor/components';
import { TokenInfo } from '@trezor/connect';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { AssetCardInfo, AssetCardInfoSkeleton } from './AssetCardInfo';
import { AssetCardTokensAndStakingInfo } from './AssetCardTokensAndStakingInfo';
import { TradingButton } from '../TradingButton';
import { handleTokensAndStakingData } from '../assetsViewUtils';

type AmountComponentProps = {
    failed: boolean;
    cryptoValue: AmountUnit;
    symbol: NetworkSymbol;
    localCurrency: BaseCurrencyCode;
    shallDisplayBaseCurrency: boolean;
};

const AmountComponent = ({ failed, cryptoValue, symbol, localCurrency }: AmountComponentProps) =>
    !failed ? (
        <Column gap={4}>
            <Row data-testid={`@dashboard/asset/${symbol}/fiat-amount`}>
                <FiatHeader
                    symbol={symbol}
                    amount={cryptoValue}
                    size="medium"
                    localCurrency={localCurrency}
                />
            </Row>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <AmountUnitSwitchWrapper symbol={symbol}>
                    <CoinBalance value={cryptoValue} symbol={symbol} />
                </AmountUnitSwitchWrapper>
            </Text>
        </Column>
    ) : (
        <Note intent="critical" iconName="warning">
            <Translation id="TR_DASHBOARD_ASSET_FAILED" />
        </Note>
    );

type AssetCardProps = {
    network: Network;
    failed: boolean;
    cryptoValue: AmountUnit;
    assetsFiatBalances: AssetFiatBalance[];
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    index?: number;
    localCurrency: BaseCurrencyCode;
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
    const analytics = useAnalytics();
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    const handleCardClick = () => {
        dispatch(
            goto({ routeName: 'wallet-index', params: {
                    symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                }, }),
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
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'navigate',
                from: 'dashboard/assets',
                networkSymbol: symbol,
            },
        });
    };

    const onBuyButtonClick = () => {
        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
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
            <Column justifyContent="space-between" height="100%" gap={20} padding={{ top: 8 }}>
                <Column gap={40} flex="1" margin={{ horizontal: 8 }}>
                    <Row justifyContent="space-between">
                        <AssetCardInfo
                            network={network}
                            assetsFiatBalances={assetsFiatBalances}
                            index={index}
                        />
                        <Icon size={16} name="arrowRight" isDisabled={true} />
                    </Row>
                    <AmountComponent
                        symbol={symbol}
                        failed={failed}
                        localCurrency={localCurrency}
                        cryptoValue={cryptoValue}
                        shallDisplayBaseCurrency={shallDisplayBaseCurrency}
                    />
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
                {shallDisplayBaseCurrency && (
                    <Card data-testid="@dashboard/asset/bottom-info">
                        <Row justifyContent="space-between" flexWrap="wrap" gap={16}>
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

                            <Row gap={8}>
                                {isStakeNetwork && (
                                    <TradingButton
                                        symbol={symbol}
                                        data-testid={`@dashboard/asset/${symbol}/stake-button`}
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
                                    onClick={onBuyButtonClick}
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
            <Column gap={40} flex="1" margin={8}>
                <Row justifyContent="space-between">
                    <AssetCardInfoSkeleton animate={animate} />
                </Row>
                <Column>
                    <Row>
                        <SkeletonRectangle animate={animate} width={95} height={32} />
                    </Row>
                    <SkeletonRectangle animate={animate} width={50} height={16} />
                </Column>
            </Column>
            <Card>
                <SkeletonRectangle animate={animate} width="100%" height={40} />
            </Card>
        </Card>
    );
};
