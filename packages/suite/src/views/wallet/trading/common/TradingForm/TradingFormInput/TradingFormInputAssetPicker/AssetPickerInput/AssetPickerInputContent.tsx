import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingAssetOption,
    TradingAssetSellOption,
} from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
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
    return (
        <Row gap={12}>
            {value.isNativeToken ? (
                <CoinLogo
                    size={32}
                    symbol={value.symbol as NetworkSymbol}
                    type="tokenWithNetwork"
                />
            ) : (
                <AssetLogo
                    size={32}
                    coingeckoId={value.coingeckoId}
                    symbol={value.networkSymbol}
                    contractAddress={value.contractAddress}
                    placeholder={value.displaySymbol}
                    showNetworkIcon={true}
                />
            )}
            <Column alignItems="start">
                <Text data-testid={dataTestId ? `${dataTestId}/display-symbol` : undefined}>
                    {value.name}
                </Text>
                {!value.isNativeToken && (
                    <Text variant="tertiary" typographyStyle="label">
                        {value.networkName}
                    </Text>
                )}
            </Column>
        </Row>
    );
}
