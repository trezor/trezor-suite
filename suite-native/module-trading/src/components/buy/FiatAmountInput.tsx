import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { BoxSkeleton } from '@suite-native/atoms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { INPUT_HEIGHT, INPUT_MIN_WIDTH, TradingAmountInput } from '../general/TradingAmountInput';

export const FiatAmountInput = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const { fiatAmountTransformer } = useAmountInputTransformers(undefined);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const amountInCrypto = form.watch('amountInCrypto');

    if (isLoading && amountInCrypto) {
        return (
            <BoxSkeleton
                height={INPUT_HEIGHT}
                width={INPUT_MIN_WIDTH}
                accessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            />
        );
    }

    return (
        <TradingAmountInput
            name="fiatValue"
            accessibilityLabel={translate('moduleTrading.selectFiat.amountLabel')}
            inputTransformer={fiatAmountTransformer}
        />
    );
};
