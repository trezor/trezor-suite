import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { TradingAmountInput } from '../general/TradingAmountInput';

export const FiatAmountInput = () => {
    const { translate } = useTranslate();
    const { fiatAmountTransformer } = useAmountInputTransformers(undefined);

    return (
        <TradingAmountInput
            name="fiatValue"
            accessibilityLabel={translate('moduleTrading.selectFiat.amountLabel')}
            inputTransformer={fiatAmountTransformer}
        />
    );
};
