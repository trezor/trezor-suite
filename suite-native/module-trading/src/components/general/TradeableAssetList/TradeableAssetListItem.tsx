import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { type TradeableAssetBalance } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { AssetListItem } from '../AssetListItem';

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
    balance?: TradeableAssetBalance;
    onPress: () => void;
};

export const TradeableAssetListItem = ({
    asset,
    balance,
    onPress,
}: TradeableAssetListItemProps) => {
    const { symbol, name, contractAddress, cryptoId } = asset;

    const networkSymbol = cryptoIdToNetworkSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    const balanceContent = balance ? (
        <VStack alignItems="flex-end" spacing={0}>
            <BaseCurrencyAmountFormatter
                value={balance.fiatAmount}
                variant="body-md"
                numberOfLines={1}
            />
            <CryptoAmountFormatter
                value={balance.cryptoAmount}
                symbol={contractAddress ? (symbol as TokenSymbol) : networkSymbol}
                variant="body-sm"
                color="contentSecondary"
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </VStack>
    ) : undefined;

    return (
        <AssetListItem
            name={name}
            symbol={symbol}
            contractAddress={contractAddress}
            networkSymbol={networkSymbol}
            onPress={onPress}
            rightContent={balanceContent}
        />
    );
};
