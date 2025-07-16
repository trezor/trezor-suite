import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingCoinInfoByCryptoId } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

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
    const { showToast } = useToast();

    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, cryptoId, isEnabled } =
        asset;

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, cryptoId),
    );

    const tradeableAsset = cryptoId && coinInfo && coinInfoToTradeableAsset(cryptoId, coinInfo);

    const handlePress = () => {
        if (tradeableAsset && isEnabled) {
            onPress(tradeableAsset);
        } else {
            showToast({
                variant: 'default',
                message: <Translation id="moduleTrading.myAssetSheet.noPair.toast" />,
            });
        }
    };

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

            {fiatBalance &&
                (isEnabled ? (
                    <BaseCurrencyAmountFormatter
                        symbol={symbol}
                        value={fiatBalance}
                        variant="hint"
                        color="textSubdued"
                    />
                ) : (
                    <Text variant="label" color="textSubdued">
                        <Translation id="moduleTrading.myAssetSheet.noPair.note" />
                    </Text>
                ))}
        </VStack>
    );

    return (
        <AssetListItem
            name={name}
            symbol={tokenSymbol ?? symbol}
            contractAddress={contract}
            networkSymbol={symbol}
            onPress={handlePress}
            rightContent={balanceContent}
        />
    );
};
