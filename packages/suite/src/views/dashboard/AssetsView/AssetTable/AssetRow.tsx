import { memo } from 'react';
import { useTheme } from 'styled-components';
import { Network } from '@suite-common/wallet-config';
import { Icon, Table, Row, IconButton, Column, Text } from '@trezor/components';
import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';
import { AssetCoinLogo } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { AssetTokenRow } from './AssetTokenRow';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectAssetAccountsThatStaked } from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { AssetStakingRow } from './AssetStakingRow';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';
import { handleTokensAndStakingData } from '../assetsViewUtils';

export interface AssetTableRowProps {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: string;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
    accounts: Account[];
    localCurrency: FiatCurrencyCode;
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
        localCurrency,
        currentFiatRates,
        accounts,
    }: AssetTableRowProps) => {
        const { symbol } = network;
        const dispatch = useDispatch();
        const theme = useTheme();
        const { setCoinFilter, setSearchString } = useAccountSearch();

        const handleRowClick = () => {
            dispatch(
                goto('wallet-index', {
                    params: {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                }),
            );
            // activate coin filter and reset account search string
            setCoinFilter(symbol);
            setSearchString(undefined);
        };
        const coinDefinitions = useSelector(state => selectCoinDefinitions(state, network.symbol));
        const stakingAccountsForAsset = stakingAccounts.filter(
            account => account.symbol === network.symbol,
        );
        const accountsThatStaked = useSelector(state =>
            selectAssetAccountsThatStaked(state, stakingAccountsForAsset),
        );

        const {
            tokensFiatBalance,
            assetStakingBalance,
            shouldRenderStakingRow,
            shouldRenderTokenRow,
        } = handleTokensAndStakingData(
            assetTokens,
            accountsThatStaked,
            symbol,
            localCurrency,
            coinDefinitions,
            currentFiatRates,
        );

        return (
            <>
                <Table.Row onClick={handleRowClick}>
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
                                data-testid={`@asset-card/${symbol}/balance`}
                            >
                                <FiatValue amount={assetNativeCryptoBalance} symbol={symbol} />

                                <Text typographyStyle="hint" color={theme.textSubdued}>
                                    <AmountUnitSwitchWrapper symbol={symbol}>
                                        <CoinBalance
                                            value={assetNativeCryptoBalance}
                                            symbol={symbol}
                                        />
                                    </AmountUnitSwitchWrapper>
                                </Text>
                            </Column>
                        ) : (
                            <Text variant="destructive" typographyStyle="hint" textWrap="nowrap">
                                <Row gap={spacings.xxs}>
                                    <Icon
                                        name="warningTriangle"
                                        color={theme.legacy.TYPE_RED}
                                        size={14}
                                    />
                                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                                </Row>
                            </Text>
                        )}
                    </Table.Cell>
                    <Table.Cell align="right">
                        {!isTestnet(symbol) && <PriceTicker symbol={symbol} />}
                    </Table.Cell>

                    <Table.Cell>{!isTestnet(symbol) && <TrendTicker symbol={symbol} />}</Table.Cell>
                    <Table.Cell align="right" colSpan={2}>
                        <Row gap={spacings.md}>
                            {!isTestnet(symbol) && (
                                <CoinmarketBuyButton
                                    symbol={symbol}
                                    data-testid={`@dashboard/assets/table/${symbol}/buy-button`}
                                />
                            )}
                            <IconButton icon="arrowRight" size="small" variant="tertiary" />
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
                            <TokenIconSetWrapper accounts={accounts} network={network.symbol} />
                        }
                        network={network}
                        tokensDisplayFiatBalance={tokensFiatBalance.toFixed()}
                    />
                )}
            </>
        );
    },
);
