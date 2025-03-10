import { FieldErrors, UseControllerProps } from 'react-hook-form';

import { TradingBuyFormProps } from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { getInputState } from '@suite-common/wallet-utils';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT } from 'src/constants/wallet/trading/form';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import {
    TradingAllFormProps,
    TradingFormInputFiatCryptoProps,
    TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';

export const TradingFormInputFiat = <TFieldValues extends TradingAllFormProps>({
    cryptoInputName,
    fiatInputName,
    methods,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const locale = useSelector(selectLanguage);

    const context = useTradingFormContext();
    const { amountLimits } = context;
    const {
        control,
        formState: { errors },
        trigger,
        clearErrors,
    } = methods;

    const fiatInputError =
        cryptoInputName === FORM_OUTPUT_FIAT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.fiat
            : (errors as FieldErrors<TradingBuyFormProps>).fiatInput;
    const cryptoInputError =
        cryptoInputName === FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : undefined;

    const fiatInputRules: UseControllerProps['rules'] = {
        ...(isTradingExchangeContext(context)
            ? {
                  validate: {
                      min: validateMin(translationString),
                      decimals: validateDecimals(translationString, { decimals: 2 }),
                  },
              }
            : {
                  validate: {
                      min: validateMin(translationString),
                      decimals: validateDecimals(translationString, { decimals: 2 }),
                      minFiat: (value: string) => {
                          if (
                              value &&
                              context.amountLimits?.minFiat &&
                              new BigNumber(value).isLessThan(
                                  new BigNumber(context.amountLimits.minFiat),
                              )
                          ) {
                              return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                                  minimum: context.amountLimits.minFiat,
                                  currency: context.amountLimits.currency,
                              });
                          }
                      },
                      maxFiat: (value: string) => {
                          if (
                              value &&
                              context.amountLimits?.maxFiat &&
                              new BigNumber(value).isGreaterThan(
                                  new BigNumber(context.amountLimits.maxFiat),
                              )
                          ) {
                              return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                                  maximum: context.amountLimits.maxFiat,
                                  currency: context.amountLimits.currency,
                              });
                          }
                      },
                  },
              }),
    };

    useDidUpdate(() => {
        if (amountLimits) {
            trigger(fiatInputName);
        }
    }, [amountLimits, fiatInputName, trigger]);

    return (
        <NumberInput
            name={fiatInputName}
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            onChange={() => {
                clearErrors(cryptoInputName);
            }}
            inputState={getInputState(fiatInputError ?? cryptoInputError)}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={fiatInputError?.message ?? cryptoInputError?.message ?? null}
            innerAddon={<TradingFormInputCurrency width={100} />}
            data-testid="@trading/form/fiat-input"
        />
    );
};
