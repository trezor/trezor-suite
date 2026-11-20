import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useBuyFormContext } from './useBuyFormContext';
import { getBuyCryptoValueDecimals, setBuyCryptoValue } from '../../utils/buy/buyAmountUtils';
import { useBaseCurrencyAmountField } from '../general/useBaseCurrencyAmountField';
import { useTradeableAssetFiatRate } from '../general/useTradeableAssetFiatRate';

export const useBuyBaseCurrencyAmount = () => {
    const { control, getValues, setValue } = useBuyFormContext();
    const [asset, cryptoValue, typedBaseCurrencyAmount] = useWatch({
        control,
        name: ['asset', 'cryptoValue', 'cryptoBaseCurrencyValue'],
    });
    // Buy offers assets the wallet may not hold, so their rate is not kept up to date by the wallet.
    const rate = useTradeableAssetFiatRate(asset, { shouldFetchCurrentRate: true });

    return useBaseCurrencyAmountField({
        symbol: getSymbolFromTradeableAsset(asset),
        rate,
        decimals: getBuyCryptoValueDecimals(asset),
        cryptoAmount: cryptoValue,
        typedBaseCurrencyAmount,
        setCryptoAmount: nextCryptoValue =>
            setBuyCryptoValue({ getValues, setValue }, nextCryptoValue),
        setTypedBaseCurrencyAmount: baseCurrencyAmount =>
            setValue('cryptoBaseCurrencyValue', baseCurrencyAmount),
    });
};
