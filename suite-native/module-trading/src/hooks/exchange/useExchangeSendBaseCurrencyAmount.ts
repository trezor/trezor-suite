import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useExchangeFormContext } from './useExchangeFormContext';
import { setExchangeSendCryptoAmount } from '../../utils/exchange/exchangeSendAmountUtils';
import { useAmountInputDecimals } from '../general/useAmountInputDecimals';
import { useBaseCurrencyAmountField } from '../general/useBaseCurrencyAmountField';
import { useTradeableAssetFiatRate } from '../general/useTradeableAssetFiatRate';

export const useExchangeSendBaseCurrencyAmount = () => {
    const { control, setValue } = useExchangeFormContext();
    const [asset, account, cryptoAmount, typedBaseCurrencyAmount] = useWatch({
        control,
        name: ['sendAsset', 'sendAccount', 'sendCryptoAmount', 'sendBaseCurrencyAmount'],
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
            setExchangeSendCryptoAmount(setValue, nextCryptoAmount),
        setTypedBaseCurrencyAmount: baseCurrencyAmount =>
            setValue('sendBaseCurrencyAmount', baseCurrencyAmount),
    });
};
