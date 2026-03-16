import { memo } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type AssetFiatBalance } from '@suite-common/assets';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { type Network } from '@suite-common/wallet-config';
import { selectAnyAccountIsStakingActive, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { type AmountUnit, isTestnet } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode, TokenInfo } from '@trezor/blockchain-link-types';
import { Column, Icon, IconButton, Row, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import {
    AmountUnitSwitchWrapper,
    BaseCurrencyValue,
    CoinBalance,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { AssetCoinLogo } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { AssetStakingRow } from './AssetStakingRow';
import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';
import { AssetTokenRow } from './AssetTokenRow';
import { TradingButton } from '../TradingButton';
import { handleTokensAndStakingData } from '../assetsViewUtils';

export interface AssetTableRowProps {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: AmountUnit;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
    accounts: Account[];
    baseCurrencyCode: BaseCurrencyCode;
    currentFiatRates?: RatesByKey;
}

export const AssetRow = memo(
    ({
        network,
        failed,
        assetNativeCryptoBalance,
        assetTokens,
        stakingAccounts,
        assetsFiatBalances,
        baseCurrencyCode,
        currentFiatRates,
        accounts,
        isStakeNetwork,
    }: AssetTableRowProps) => {
        const { symbol } = network;
        const dispatch = useDispatch();
        const analytics = useAnalytics();
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

        const handleRowClick = () => {
            dispatch(
                goto({
                    routeName: 'wallet-index',
                    params: {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                }),
            );
        };
        const coinDefinitions = useSelector(state => selectCoinDefinitions(state, network.symbol));
        const stakingAccountsForAsset = stakingAccounts.filter(
            account => account.symbol === network.symbol,
        );

        const isStakingActive = useSelector(state =>
            selectAnyAccountIsStakingActive(state, stakingAccountsForAsset),
        );

        const {
            tokensFiatBalance,
            assetStakingBalance,
            shouldRenderStakingRow,
            shouldRenderTokenRow,
        } = handleTokensAndStakingData(
            assetTokens,
            stakingAccountsForAsset,
            isStakingActive,
            symbol,
            baseCurrencyCode,
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
            <>
                <Table.Row onClick={handleRowClick} data-testid={`@dashboard/asset-item/${symbol}`}>
                    <Table.Cell align="center">
                        <Section
                            $dashedLinePosition={
                                shouldRenderStakingRow || shouldRenderTokenRow
                                    ? 'middleToBottom'
                                    : undefined
                            }
                        >
                            <AssetCoinLogo
                                symbol={symbol}
                                assetsFiatBalances={assetsFiatBalances}
                            />
                        </Section>
                    </Table.Cell>
                    <Table.Cell padding={{ left: spacings.zero }}>
                        <AssetCoinName network={network} />
                    </Table.Cell>
                    <Table.Cell>
                        {!failed ? (
                            <Column
                                alignItems="flex-start"
                                justifyContent="center"
                                gap={spacings.xxxs}
                                data-testid={`@dashboard/asset/${symbol}/fiat-amount`}
                            >
                                <BaseCurrencyValue
                                    amount={assetNativeCryptoBalance}
                                    symbol={symbol}
                                />

                                {!assetNativeCryptoBalance.eq(0) && (
                                    <Text
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <AmountUnitSwitchWrapper symbol={symbol}>
                                            <CoinBalance
                                                value={assetNativeCryptoBalance}
                                                symbol={symbol}
                                            />
                                        </AmountUnitSwitchWrapper>
                                    </Text>
                                )}
                            </Column>
                        ) : (
                            <Text intent="critical" typographyStyle="body-sm" textWrap="nowrap">
                                <Row gap={spacings.xxs}>
                                    <Icon name="warning" intent="critical" size={14} />
                                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                                </Row>
                            </Text>
                        )}
                    </Table.Cell>
                    <Table.Cell align="end" data-testid="@dashboard/asset/exchange-rate">
                        {shallDisplayBaseCurrency && <PriceTicker symbol={symbol} />}
                    </Table.Cell>

                    <Table.Cell data-testid="@dashboard/asset/week-change">
                        {shallDisplayBaseCurrency && <TrendTicker symbol={symbol} />}
                    </Table.Cell>
                    <Table.Cell align="end" colSpan={2}>
                        <Row gap={spacings.md}>
                            {isStakeNetwork && (
                                <TradingButton
                                    symbol={symbol}
                                    onClick={onStakeButtonClick}
                                    routeName="wallet-staking"
                                >
                                    <Translation id="TR_STAKE_STAKE" />
                                </TradingButton>
                            )}

                            {!isTestnet(symbol) && (
                                <TradingButton
                                    symbol={symbol}
                                    routeName="wallet-trading-buy"
                                    data-testid={`@dashboard/asset/${symbol}/buy-button`}
                                    onClick={onBuyButtonClick}
                                >
                                    <Translation id="TR_BUY_BUY" />
                                </TradingButton>
                            )}
                            <IconButton icon="arrowRight" intent="neutral" priority="secondary" />
                        </Row>
                    </Table.Cell>
                </Table.Row>
                {shouldRenderStakingRow && (
                    <AssetStakingRow
                        stakingTotalBalance={assetStakingBalance.toFixed()}
                        symbol={symbol}
                        shouldRenderTokenRow={shouldRenderTokenRow}
                    />
                )}
                {shouldRenderTokenRow && (
                    <AssetTokenRow
                        tokenIconSetWrapper={
                            <TokenIconSetWrapper accounts={accounts} symbol={network.symbol} />
                        }
                        network={network}
                        tokensDisplayFiatBalance={tokensFiatBalance.toFixed()}
                    />
                )}
            </>
        );
    },
);
