import { TradingAssetOption } from '@suite-common/trading';
import { Badge, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

export type AssetPickerInputContentProps = {
    value: TradingAssetOption;
    dataTestId?: string;
};

export function AssetPickerInputContent({ value, dataTestId }: AssetPickerInputContentProps) {
    return (
        <Row gap={spacings.sm}>
            {value.isNativeToken ? (
                <CoinLogo size={20} symbol={value.symbol} type="tokenWithNetwork" />
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
            <Text data-testid={`${dataTestId}/display-symbol`}>{value.displaySymbol}</Text>
            <Text variant="tertiary" typographyStyle="label">
                {value.name}
            </Text>
            {!value.isNativeToken ? <Badge size="small">{value.networkName}</Badge> : null}
        </Row>
    );
}
