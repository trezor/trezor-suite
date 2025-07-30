import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { MAX_FIAT_DECIMALS } from '../../../consts/general/consts';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { useSellInputFormControls } from '../../../hooks/sell/useSellInputFormControls';
import { AmountInput } from '../../general/Input/AmountInput';

const FIAT_AMOUNT_TEST_ID = '@trading/sell/fiat-amount-input';

export const SellFiatAmountInput = () => {
    const { translate } = useTranslate();
    const { watch } = useSellFormContext();
    const { fiatAmountTransformer } = useAmountInputTransformers(undefined);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const inputControls = useSellInputFormControls('fiatStringAmount');

    const amountInCrypto = watch('amountInCrypto');

    return (
        <AmountInput
            {...inputControls}
            accessibilityLabel={translate('moduleTrading.selectFiat.sell.amountLabel')}
            inputTransformer={fiatAmountTransformer}
            maxDecimals={MAX_FIAT_DECIMALS}
            testID={FIAT_AMOUNT_TEST_ID}
            isLoading={isLoading && amountInCrypto}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
        />
    );
};
