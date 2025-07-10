import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingCoinInfoByCryptoId } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';

import { MyAsset, TradeableAsset } from '../../../types/general';
import { coinInfoToTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { ASSET_ITEM_HEIGHT, AssetListItem } from '../AssetListItem';

export type MyAssetListItemProps = {
    account: Account;
    asset: MyAsset;
    onPress: (asset: TradeableAsset) => void;
};

export { ASSET_ITEM_HEIGHT };

export const MyAssetListItem = ({ asset, onPress }: MyAssetListItemProps) => {
    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, cryptoId } = asset;

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, cryptoId),
    );

    const tradeableAsset = cryptoId && coinInfo && coinInfoToTradeableAsset(cryptoId, coinInfo);

    if (!tradeableAsset) {
        return null;
    }

    const balanceContent = (
        <VStack alignItems="flex-end">
            {tokenSymbol !== undefined ? (
                <TokenAmountFormatter
                    value={balance}
                    tokenSymbol={tokenSymbol}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    color="textDefault"
                    variant="body"
                />
            ) : (
                <CryptoAmountFormatter
                    value={balance}
                    symbol={symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    color="textDefault"
                    variant="body"
                />
            )}

            {fiatBalance && (
                <BaseCurrencyAmountFormatter
                    symbol={symbol}
                    value={fiatBalance}
                    variant="hint"
                    color="textSubdued"
                />
            )}
        </VStack>
    );

    return (
        <AssetListItem
            name={name}
            symbol={tradeableAsset.symbol}
            cryptoId={cryptoId}
            contractAddress={contract}
            networkSymbol={symbol}
            onPress={() => onPress(tradeableAsset)}
            rightContent={balanceContent}
        />
    );
};
