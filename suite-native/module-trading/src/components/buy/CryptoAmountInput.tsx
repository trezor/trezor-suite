import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';
import { TradingAmountInput } from '../general/TradingAmountInput';

export const CryptoAmountInput = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();

    const symbol = getSelectedSymbolFromBuyForm(form);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);

    const isAssetSelect = !!form.watch('asset');

    return (
        <TradingAmountInput
            name="cryptoValue"
            accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
            editable={isAssetSelect}
            inputTransformer={cryptoAmountTransformer}
        />
    );
};
