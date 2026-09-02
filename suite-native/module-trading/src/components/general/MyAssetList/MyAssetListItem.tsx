import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { type MyAsset } from '@suite-native/trading-types';

import { AssetListItem } from '../AssetListItem';

export type MyAssetListItemProps = {
    asset: MyAsset;
    onPress?: () => void;
};

export const MyAssetListItem = ({ asset, onPress }: MyAssetListItemProps) => {
    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, decimals, isEnabled } =
        asset;
    const hasFiatBalance = fiatBalance !== null;

    const cryptoBalanceValue =
        tokenSymbol != null ? (
            <CompactTokenAmountFormatter
                value={asDecimalTokenAmount(balance)}
                tokenSymbol={tokenSymbol}
                tokenDecimals={decimals}
                numberOfLines={1}
                adjustsFontSizeToFit
                color="contentSecondary"
                variant="body-sm"
            />
        ) : (
            <CompactCryptoAmountFormatter
                value={balance}
                symbol={symbol}
                numberOfLines={1}
                adjustsFontSizeToFit
                color="contentSecondary"
                variant="body-sm"
            />
        );

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
                    {hasFiatBalance && (
                        <BaseCurrencyAmountFormatter
                            value={fiatBalance}
                            variant="body-md"
                            numberOfLines={1}
                        />
                    )}
                    {cryptoBalanceValue}
                </VStack>
            }
        />
    );
};
