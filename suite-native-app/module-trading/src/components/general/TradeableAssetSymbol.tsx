import { cryptoIdToNetworkSymbol, isSendingEvmNativeToken } from '@suite-common/trading';
import { type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';
import { type TradeableAsset } from '@suite-native/trading-types';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type TradeableAssetSymbolProps = Omit<TextProps, 'children'> & {
    asset: TradeableAsset;
};

export const TradeableAssetSymbol = ({ asset, ...textProps }: TradeableAssetSymbolProps) => {
    const networkSymbol = cryptoIdToNetworkSymbol(asset.cryptoId);

    // Token symbols resolve from metadata so that URLs in unrecognized tokens are masked.
    if (asset.contractAddress && networkSymbol && !isSendingEvmNativeToken(asset.cryptoId)) {
        return (
            <TokenSymbol
                {...textProps}
                networkSymbol={networkSymbol}
                contractAddress={asset.contractAddress}
                isTruncated
            />
        );
    }

    return <NetworkSymbolExtendedFormatter {...textProps} symbol={asset.symbol} />;
};
