import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useSellFormContext } from './useSellFormContext';
import { setSellCryptoAmount } from '../../utils/sell/sellAmountUtils';
import { useAmountInputDecimals } from '../general/useAmountInputDecimals';
import { useBaseCurrencyAmountField } from '../general/useBaseCurrencyAmountField';
import { useTradeableAssetFiatRate } from '../general/useTradeableAssetFiatRate';

export const useSellSendBaseCurrencyAmount = () => {
    const { control, getValues, setValue } = useSellFormContext();
    const [asset, account, cryptoAmount, typedBaseCurrencyAmount] = useWatch({
        control,
        name: ['sendAsset', 'sendAccount', 'cryptoStringAmount', 'cryptoBaseCurrencyStringAmount'],
    });
    const rate = useTradeableAssetFiatRate(asset);
    const decimals = useAmountInputDecimals(account, asset?.contractAddress);

    return useBaseCurrencyAmountField({
        symbol: getSymbolFromTradeableAsset(asset),
        rate,
        decimals,
        cryptoAmount,
        typedBaseCurrencyAmount,
        setCryptoAmount: nextCryptoAmount =>
            setSellCryptoAmount({ getValues, setValue }, nextCryptoAmount),
        setTypedBaseCurrencyAmount: baseCurrencyAmount =>
            setValue('cryptoBaseCurrencyStringAmount', baseCurrencyAmount),
    });
};
