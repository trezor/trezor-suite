import { AssetIcon, AssetSymbol } from '@suite/assets';
import { createAssetId } from '@suite-common/asset-types';
import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { Row } from '@trezor/components';

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
    const { networkSymbol } = value;
    const { contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(value.id);

    const assetId = createAssetId({ networkSymbol, contractAddress });

    return (
        <Row gap={8} alignItems="center">
            <AssetIcon size={24} assetId={assetId} showNetworkIcon />
            <span data-testid="@asset-picker/display-symbol">
                <AssetSymbol assetId={assetId} isTruncated />
            </span>
        </Row>
    );
}
