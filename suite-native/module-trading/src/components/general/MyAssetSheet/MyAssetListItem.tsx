import { useSelector } from 'react-redux';

import { type TradingRootState, selectTradingCoinInfoByCryptoId } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { type MyAsset, type TradeableAsset } from '@suite-native/trading-types';

import { AssetListItem } from '../AssetListItem';

export type MyAssetListItemProps = {
    account: Account;
    asset: MyAsset;
    onPress: (asset: TradeableAsset, account: Account) => void;
};

export const MyAssetListItem = ({ account, asset, onPress }: MyAssetListItemProps) => {
    const { showToast } = useToast();

    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, cryptoId, isEnabled } =
        asset;

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, cryptoId),
    );

    const tradeableAsset = cryptoId && coinInfo && coinInfoToTradeableAsset(cryptoId, coinInfo);

    const handlePress = () => {
        if (tradeableAsset && isEnabled) {
            onPress(tradeableAsset, account);
        } else {
            showToast({
                intent: 'neutral',
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
                    color="contentPrimary"
                    variant="body-md"
                />
            ) : (
                <CryptoAmountFormatter
                    value={balance}
                    symbol={symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    color="contentPrimary"
                    variant="body-md"
                />
            )}

            {fiatBalance &&
                (isEnabled ? (
                    <BaseCurrencyAmountFormatter
                        symbol={symbol}
                        value={fiatBalance}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                ) : (
                    <Text variant="body-xs" color="contentSecondary">
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
