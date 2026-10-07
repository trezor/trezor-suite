import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Column, Divider, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useDashboardChainAssets } from 'src/hooks/wallet/chainData/useDashboardChainAssets';

import { type AssetTotal } from './groupChainAssetsByNetwork';

type AssetRowProps = {
    networkSymbol: NetworkSymbol;
    asset: AssetTotal;
};

const AssetRow = ({ networkSymbol, asset }: AssetRowProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const currency = useSelector(selectBaseCurrency);

    return (
        <Row justifyContent="space-between" gap={16}>
            <Text typographyStyle="body-md">
                <FormattedCryptoAmount
                    value={asset.amount}
                    symbol={asset.contract ? asset.symbol?.toLowerCase() : networkSymbol}
                    contractAddress={asset.contract}
                    tokenDecimals={asset.decimals}
                />
            </Text>
            {asset.fiatValue !== null && (
                <HiddenPlaceholder>
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(asset.fiatValue))}
                        currency={currency}
                    />
                </HiddenPlaceholder>
            )}
        </Row>
    );
};

/**
 * Debug view of the `queryChainData` flag: every listed account's assets read through chain
 * networks, grouped per network as the dashboard does today.
 */
export const ChainAssetsList = () => {
    const { isEnabled, groups } = useDashboardChainAssets();

    if (!isEnabled) return null;

    return (
        <DashboardSection heading={<Translation id="TR_MY_ASSETS" />}>
            <Card data-testid="@dashboard/chain-assets">
                <Column gap={12}>
                    {groups.map((group, index) => (
                        <Column key={group.symbol} gap={8}>
                            {index > 0 && <Divider />}
                            <Text typographyStyle="body-md-strong">
                                {getNetwork(group.symbol).name}
                            </Text>
                            {group.native && (
                                <AssetRow networkSymbol={group.symbol} asset={group.native} />
                            )}
                            {group.tokens.map(token => (
                                <AssetRow
                                    key={token.contract}
                                    networkSymbol={group.symbol}
                                    asset={token}
                                />
                            ))}
                        </Column>
                    ))}
                </Column>
            </Card>
        </DashboardSection>
    );
};
