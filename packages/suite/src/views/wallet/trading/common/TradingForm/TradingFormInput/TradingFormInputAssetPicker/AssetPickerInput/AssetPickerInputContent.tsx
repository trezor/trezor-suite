import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
} from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Column, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

export type AssetPickerInputContentProps = {} & (
    | {
          name: typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
          value: TradingAssetSellOption;
      }
    | {
          name:
              | typeof TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT
              | typeof TRADING_FORM_CRYPTO_CURRENCY_SELECT;
          value: TradingAssetOption;
      }
);

export function AssetPickerInputContent({ value }: AssetPickerInputContentProps) {
    const {
        isNativeToken,
        networkSymbol,
        symbol,
        displaySymbol,
        name,
        coingeckoId,
        contractAddress,
        networkName,
    } = value;
    const displayName = isNativeToken ? getNetworkDisplaySymbolName(networkSymbol) : name;
    const showNetwork = networkSymbol !== displaySymbol.toLowerCase();

    return (
        <Row gap={12}>
            {isNativeToken ? (
                <CoinLogo size={32} symbol={symbol as NetworkSymbol} type="tokenWithNetwork" />
            ) : (
                <AssetLogo
                    size={32}
                    coingeckoId={coingeckoId}
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    placeholder={displaySymbol}
                    showNetworkIcon={showNetwork}
                />
            )}
            <Column alignItems="start">
                <Text data-testid="@asset-picker/display-symbol">{displayName}</Text>
                {showNetwork && (
                    <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                        {networkName}
                    </Text>
                )}
            </Column>
        </Row>
    );
}
