import { memo } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { TRADING_FORM_AMOUNT_IN_CRYPTO } from '@suite-common/trading';
import { Text } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingFormInputFiatCryptoWrapProps,
} from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';

export const TradingFormInputFiatCrypto = memo(function TradingFormInputFiatCryptoInner({
    showLabel = true,
    cryptoInputName,
    cryptoSelectName,
    fiatInputName,
}: TradingFormInputFiatCryptoWrapProps) {
    const { type, ...context } = useTradingFormContext();
    const getValues = context.getValues as UseFormReturn<TradingAllFormProps>['getValues'];

    const amountInCrypto = getValues(TRADING_FORM_AMOUNT_IN_CRYPTO);
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });

    const inputProps = {
        cryptoInputName,
        fiatInputName,
        cryptoSelectName,
        labelLeft: showLabel ? (
            <Text intent="neutral" priority="secondary">
                <Translation id={amountLabels.inputLabel} />
            </Text>
        ) : undefined,
    } satisfies TradingFormInputFiatCryptoProps;

    return amountInCrypto ? (
        <TradingFormInputCryptoAmount {...inputProps} />
    ) : (
        <TradingFormInputFiat {...inputProps} />
    );
});
