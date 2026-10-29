import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { useFiatAmountMaxDecimals } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyInputFormControls } from '../../hooks/buy/useBuyInputFormControls';
import { AmountInput } from '../general/Input/AmountInput';

const FIAT_AMOUNT_TEST_ID = '@trading/buy/fiat-amount-input';

export const BuyFiatAmountInput = () => {
    const { translate } = useTranslate();
    const { control } = useBuyFormContext();
    const maxDecimals = useFiatAmountMaxDecimals(MAX_FIAT_DECIMALS);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const inputControls = useBuyInputFormControls('fiatValue');

    const amountInCrypto = useWatch({ control, name: 'amountInCrypto' });

    return (
        <AmountInput
            {...inputControls}
            accessibilityLabel={translate('moduleTrading.selectFiat.buy.amountLabel')}
            maxDecimals={maxDecimals}
            testID={FIAT_AMOUNT_TEST_ID}
            isLoading={isLoading && amountInCrypto}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
        />
    );
};
