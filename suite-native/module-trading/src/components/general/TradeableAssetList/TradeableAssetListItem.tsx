import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type TradeableAsset } from '@suite-native/trading-types';

import { AssetListItem } from '../AssetListItem';

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
    onPress: () => void;
};

export const TradeableAssetListItem = ({ asset, onPress }: TradeableAssetListItemProps) => {
    const { symbol, name, contractAddress, cryptoId } = asset;

    const networkSymbol = cryptoIdToNetworkSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    return (
        <AssetListItem
            name={name}
            symbol={symbol}
            contractAddress={contractAddress}
            networkSymbol={networkSymbol}
            onPress={onPress}
        />
    );
};
