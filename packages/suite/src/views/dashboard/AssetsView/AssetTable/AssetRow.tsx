import { memo } from 'react';
import { useTheme } from 'styled-components';
import { Network } from '@suite-common/wallet-config';
import { Icon, Table, Row, IconButton, Column } from '@trezor/components';
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
import { useAccountSearch, useDispatch } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';
import { AssetFiatBalance } from '@suite-common/assets';
import { AssetCoinLogo } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';
import { Text } from '@trezor/components';

interface AssetTableProps {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    isLastRow?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
}

export const AssetRow = memo(
    ({ network, failed, cryptoValue, assetsFiatBalances }: AssetTableProps) => {
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

        return (
            <Table.Row onClick={handleRowClick}>
                <Table.Cell colSpan={3}>
                    <Row>
                        <AssetCoinLogo
                            symbol={network.symbol}
                            assetsFiatBalances={assetsFiatBalances}
                        />
                        <AssetCoinName network={network} />
                    </Row>
                </Table.Cell>

                <Table.Cell>
                    {!failed ? (
                        <Column
                            flex="1"
                            alignItems="flex-start"
                            justifyContent="center"
                            gap={spacings.xxxs}
                            data-testid={`@asset-card/${symbol}/balance`}
                        >
                            <FiatValue amount={cryptoValue} symbol={symbol} />

                            <Text typographyStyle="hint" color={theme.textSubdued}>
                                <AmountUnitSwitchWrapper symbol={symbol}>
                                    <CoinBalance value={cryptoValue} symbol={symbol} />
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
                <Table.Cell>{!isTestnet(symbol) && <PriceTicker symbol={symbol} />}</Table.Cell>

                <Table.Cell>{!isTestnet(symbol) && <TrendTicker symbol={symbol} />}</Table.Cell>
                <Table.Cell align="right" colSpan={2}>
                    <Row gap={16}>
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
        );
    },
);
