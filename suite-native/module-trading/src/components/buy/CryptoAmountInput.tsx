import { Pressable } from 'react-native';

import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';
import { TradingAmountInput } from '../general/TradingAmountInput';

export type CryptoAmountInputProps = {
    showAssetsSheet: () => void;
};

export const CryptoAmountInput = ({ showAssetsSheet }: CryptoAmountInputProps) => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();

    const symbol = getSelectedSymbolFromBuyForm(form);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);

    const isAssetSelected = !!form.watch('asset');

    if (!isAssetSelected) {
        // we really do need to have Pressable and Input.onPress here because of the different
        // behavior on iOS and Android
        return (
            <Pressable onPress={showAssetsSheet}>
                <TradingAmountInput
                    name="cryptoValue"
                    accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
                    editable={false}
                    inputTransformer={cryptoAmountTransformer}
                    onPress={showAssetsSheet}
                />
            </Pressable>
        );
    }

    return (
        <TradingAmountInput
            name="cryptoValue"
            accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
            editable={isAssetSelected}
            inputTransformer={cryptoAmountTransformer}
        />
    );
};
