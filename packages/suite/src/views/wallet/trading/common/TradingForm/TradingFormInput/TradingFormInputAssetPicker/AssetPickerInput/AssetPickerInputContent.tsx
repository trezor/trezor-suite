import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingAssetOption,
    TradingAssetSellOption,
} from '@suite-common/trading';
import { NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Column, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

export type AssetPickerInputContentProps = {
    dataTestId?: string;
} & (
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

export function AssetPickerInputContent({ value, dataTestId }: AssetPickerInputContentProps) {
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
                <Text data-testid={dataTestId ? `${dataTestId}/display-symbol` : undefined}>
                    {displayName}
                </Text>
                {showNetwork && (
                    <Text variant="tertiary" typographyStyle="label">
                        {networkName}
                    </Text>
                )}
            </Column>
        </Row>
    );
}
