import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { BoxSkeleton } from '@suite-native/atoms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';
import {
    MAX_INPUT_HEIGHT,
    MIN_INPUT_WIDTH,
    TradingAmountInput,
} from '../general/TradingAmountInput';

export type CryptoAmountInputProps = {
    showAssetsSheet: () => void;
};

const pressableStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export const CryptoAmountInput = ({ showAssetsSheet }: CryptoAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const symbol = getSelectedSymbolFromBuyForm(form);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const amountInCrypto = form.watch('amountInCrypto');
    const isAssetSelected = !!form.watch('asset');

    if (isLoading && !amountInCrypto) {
        return (
            <BoxSkeleton
                height={MAX_INPUT_HEIGHT}
                width={MIN_INPUT_WIDTH}
                accessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            />
        );
    }

    if (!isAssetSelected) {
        // we really do need to have Pressable and Input.onPress here because of the different
        // behavior on iOS and Android
        return (
            <Pressable onPress={showAssetsSheet} style={applyStyle(pressableStyle)}>
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
