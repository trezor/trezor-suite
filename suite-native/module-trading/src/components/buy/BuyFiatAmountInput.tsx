import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { MAX_FIAT_DECIMALS } from '../../consts/general/consts';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyInputFormControls } from '../../hooks/buy/useBuyInputFormControls';
import { AmountInput } from '../general/Input/AmountInput';

const FIAT_AMOUNT_TEST_ID = '@trading/buy/fiat-amount-input';

export const BuyFiatAmountInput = () => {
    const { translate } = useTranslate();
    const { watch } = useBuyFormContext();
    const { fiatAmountTransformer } = useAmountInputTransformers(undefined);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const inputControls = useBuyInputFormControls('fiatValue');

    const amountInCrypto = watch('amountInCrypto');

    return (
        <AmountInput
            {...inputControls}
            accessibilityLabel={translate('moduleTrading.selectFiat.amountLabel')}
            inputTransformer={fiatAmountTransformer}
            maxDecimals={MAX_FIAT_DECIMALS}
            testID={FIAT_AMOUNT_TEST_ID}
            isLoading={isLoading && amountInCrypto}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
        />
    );
};
