import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
} from '@suite-common/trading';
import { Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

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
        contractAddress,
        networkName,
        displaySymbolName,
    } = value;
    const showNetwork = networkSymbol !== displaySymbol.toLowerCase();

    return (
        <Row gap={12}>
            {isNativeToken ? (
                <TokenIcon size={32} symbol={symbol} showNetworkIcon />
            ) : (
                <TokenIcon
                    size={32}
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    placeholder={displaySymbol}
                    showNetworkIcon={showNetwork}
                />
            )}
            <Column alignItems="start">
                <Text
                    intent="neutral"
                    priority="primary"
                    typographyStyle="body-md"
                    data-testid="@asset-picker/display-symbol"
                >
                    {displaySymbolName ?? name}
                </Text>
                {showNetwork && (
                    <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                        {networkName}
                    </Text>
                )}
            </Column>
        </Row>
    );
}
