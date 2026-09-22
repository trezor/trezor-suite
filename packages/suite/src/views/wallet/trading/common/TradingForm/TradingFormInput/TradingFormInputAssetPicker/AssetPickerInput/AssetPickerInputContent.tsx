import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
} from '@suite-common/trading';
import { Row } from '@trezor/components';
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
    const { isNativeToken, networkSymbol, symbol, displaySymbol, contractAddress } = value;
    const showNetwork = networkSymbol !== displaySymbol.toLowerCase();

    return (
        <Row gap={8} alignItems="center">
            {isNativeToken ? (
                <TokenIcon size={20} symbol={symbol} showNetworkIcon />
            ) : (
                <TokenIcon
                    size={20}
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    placeholder={displaySymbol}
                    showNetworkIcon={showNetwork}
                />
            )}
            <span data-testid="@asset-picker/display-symbol">{displaySymbol}</span>
        </Row>
    );
}
