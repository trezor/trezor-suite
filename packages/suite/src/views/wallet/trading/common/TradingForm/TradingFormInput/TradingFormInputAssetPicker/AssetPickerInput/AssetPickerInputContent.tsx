import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingAssetOption,
    TradingAssetSellOption,
} from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Badge, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { AssetPickerAccountLabel } from './AssetPickerAccountLabel';

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

export function AssetPickerInputContent({ name, value, dataTestId }: AssetPickerInputContentProps) {
    return (
        <Row gap={12}>
            {value.isNativeToken ? (
                <CoinLogo
                    size={20}
                    symbol={value.symbol as NetworkSymbol}
                    type="tokenWithNetwork"
                />
            ) : (
                <AssetLogo
                    size={20}
                    coingeckoId={value.coingeckoId}
                    symbol={value.networkSymbol}
                    contractAddress={value.contractAddress}
                    placeholder={value.displaySymbol}
                    showNetworkIcon={false}
                />
            )}
            <Text data-testid={dataTestId ? `${dataTestId}/display-symbol` : undefined}>
                {value.displaySymbol}
            </Text>
            <Text variant="tertiary" typographyStyle="label">
                {value.name}
            </Text>
            {name === TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT && (
                <AssetPickerAccountLabel accountKey={value.accountKey} />
            )}
            {!value.isNativeToken ? <Badge size="small">{value.networkName}</Badge> : null}
        </Row>
    );
}
