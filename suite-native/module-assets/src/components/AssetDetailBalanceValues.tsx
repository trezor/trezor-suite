import { useSelector } from 'react-redux';

import {
    type AssetsRootState as CommonAssetsRootState,
    selectAssetTokenInfo,
} from '@suite-common/assets';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { type AssetsRootState, selectAssetCryptoValue, useAssetPrice } from '@suite-native/assets';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailBalanceValues = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();

    const token = useSelector((state: CommonAssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const cryptoBalance = useSelector((state: AssetsRootState) =>
        selectAssetCryptoValue(state, networkSymbol, tokenContract),
    );

    const { price } = useAssetPrice({ networkSymbol, tokenContract });

    const fiatBalance =
        price === null ? null : asBaseCurrencyAmount(price.multipliedBy(cryptoBalance));

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
                    tokenSymbol={token?.symbol ? toTokenSymbol(token.symbol) : null}
                    maxDisplayedDecimals={token?.decimals}
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
