import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { selectWalletAssetContractAddress, selectWalletAssetSymbol } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { TrendTicker } from 'src/components/suite';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';

type AssetDetailMarketPriceProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailMarketPrice = ({ assetKey }: AssetDetailMarketPriceProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));

    if (symbol === undefined) {
        return null;
    }

    return (
        <Card data-testid="@asset-detail/market-price">
            <Column gap={8} alignItems="flex-start">
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_ASSET_DETAIL_MARKET_PRICE" />
                </Text>
                <Text typographyStyle="headline-md">
                    <HiddenPlaceholder>
                        <BaseCurrencyValue
                            amount="1"
                            symbol={symbol}
                            tokenAddress={contractAddress}
                            fiatRateFormatterOptions={{
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 4,
                            }}
                        >
                            {({ rate }) => rate}
                        </BaseCurrencyValue>
                    </HiddenPlaceholder>
                </Text>
                <TrendTicker
                    symbol={symbol}
                    contractAddress={contractAddress}
                    noEmptyStateTooltip
                />
            </Column>
        </Card>
    );
};
