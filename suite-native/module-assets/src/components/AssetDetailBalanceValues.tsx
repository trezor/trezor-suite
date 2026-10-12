import { useSelector } from 'react-redux';

import {
    type AssetsRootState,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
    selectWalletAssetTotalAmount,
} from '@suite-common/assets';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { useAssetPrice } from '@suite-native/assets';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailBalanceValues = () => {
    const { assetKey, networkSymbol, tokenContract } = useAssetDetailAsset();

    const cryptoBalance = useSelector((state: AssetsRootState) =>
        selectWalletAssetTotalAmount(state, assetKey),
    );
    const tokenSymbol = useSelector((state: AssetsRootState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: AssetsRootState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );

    const { price } = useAssetPrice({ networkSymbol, tokenContract });

    const fiatBalance =
        price === null || cryptoBalance === undefined
            ? null
            : asBaseCurrencyAmount(price.multipliedBy(cryptoBalance));

    if (networkSymbol === undefined || cryptoBalance === undefined) return null;

    return (
        <VStack alignItems="flex-end" spacing={0} flex={1}>
            <BaseCurrencyAmountFormatter
                value={fiatBalance}
                symbol={networkSymbol}
                variant="body-md-strong"
                numberOfLines={1}
                adjustsFontSizeToFit
            />
            {tokenContract ? (
                <ExactTokenAmountFormatter
                    value={asDecimalTokenAmount(cryptoBalance)}
                    tokenSymbol={tokenSymbol ? toTokenSymbol(tokenSymbol) : null}
                    maxDisplayedDecimals={tokenDecimals}
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            ) : (
                <ExactCryptoAmountFormatter
                    value={cryptoBalance}
                    symbol={networkSymbol}
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            )}
        </VStack>
    );
};
