import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { BoxSkeleton } from '@suite-native/atoms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { MAX_FIAT_DECIMALS } from '../../consts';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import {
    MAX_INPUT_HEIGHT,
    MIN_INPUT_WIDTH,
    TradingAmountInput,
} from '../general/TradingAmountInput';

const FIAT_AMOUNT_TEST_ID = '@trading/buy/fiat-amount-input';

export const FiatAmountInput = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const { fiatAmountTransformer } = useAmountInputTransformers(undefined);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const amountInCrypto = form.watch('amountInCrypto');

    if (isLoading && amountInCrypto) {
        return (
            <BoxSkeleton
                height={MAX_INPUT_HEIGHT}
                width={MIN_INPUT_WIDTH}
                accessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            />
        );
    }

    return (
        <TradingAmountInput
            name="fiatValue"
            accessibilityLabel={translate('moduleTrading.selectFiat.amountLabel')}
            inputTransformer={fiatAmountTransformer}
            maxDecimals={MAX_FIAT_DECIMALS}
            testID={FIAT_AMOUNT_TEST_ID}
        />
    );
};
