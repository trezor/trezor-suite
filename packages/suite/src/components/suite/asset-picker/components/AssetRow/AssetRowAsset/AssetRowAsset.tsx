import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AssetAmount } from './AssetAmount';
import { AssetDetails } from './AssetDetails';
import { AssetRowAssetDataProps } from '../../../constants';
import { AssetImage } from '../AssetImage';
import { ItemClickableContainer } from '../ItemClickableContainer';

export type AssetRowAssetProps = AssetRowAssetDataProps & {
    'data-testid'?: string;
};

export function AssetRowAsset({
    networkSymbol,
    coingeckoId,
    contractAddress,
    symbol,
    name,
    fiatAmount,
    amount,
    'data-testid': dataTestId,
}: AssetRowAssetProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                alert('TODO:');
            }}
        >
            <Row data-testid={dataTestId} gap={spacings.sm}>
                <AssetImage
                    networkSymbol={networkSymbol}
                    coingeckoId={coingeckoId}
                    contractAddress={contractAddress}
                    symbol={symbol}
                />
                <AssetDetails name={name} symbol={symbol} networkSymbol={networkSymbol} />
            </Row>
            {amount && (
                <AssetAmount
                    symbol={symbol}
                    fiatAmount={fiatAmount}
                    contractAddress={contractAddress}
                    amount={amount}
                />
            )}
        </ItemClickableContainer>
    );
}
