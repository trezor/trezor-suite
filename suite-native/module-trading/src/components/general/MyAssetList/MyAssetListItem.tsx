import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { type MyAsset } from '@suite-native/trading-types';

import { AssetListItem } from '../AssetListItem';

export type MyAssetListItemProps = {
    asset: MyAsset;
    onPress?: () => void;
};

export const MyAssetListItem = ({ asset, onPress }: MyAssetListItemProps) => {
    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, isEnabled } = asset;

    return (
        <AssetListItem
            name={name}
            symbol={tokenSymbol ?? getNetworkDisplaySymbol(symbol)}
            contractAddress={contract}
            networkSymbol={symbol}
            isDisabled={!isEnabled}
            onPress={isEnabled ? onPress : undefined}
            rightContent={
                <VStack alignItems="flex-end" spacing={0}>
                    {fiatBalance !== null && (
                        <BaseCurrencyAmountFormatter
                            value={fiatBalance}
                            variant="body-md"
                            numberOfLines={1}
                        />
                    )}
                    {tokenSymbol != null ? (
                        <TokenAmountFormatter
                            value={balance}
                            tokenSymbol={tokenSymbol}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            color="contentSecondary"
                            variant="body-sm"
                        />
                    ) : (
                        <CryptoAmountFormatter
                            value={balance}
                            symbol={symbol}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            color="contentSecondary"
                            variant="body-sm"
                        />
                    )}
                </VStack>
            }
        />
    );
};
