import { useTranslation } from 'src/hooks/suite';
import { NumberInput } from 'src/components/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useDidUpdate } from '@trezor/react-utils';
import { CoinmarketFormInputCurrency } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';
import {
    CoinmarketAllFormProps,
    CoinmarketBuyFormProps,
    CoinmarketFormInputFiatCryptoProps,
    CoinmarketSellExchangeFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import styled from 'styled-components';
import { FieldErrors, UseControllerProps } from 'react-hook-form';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT } from 'src/constants/wallet/coinmarket/form';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

const CoinmarketFormInputCurrencyWrapper = styled(CoinmarketFormInputCurrency)`
    width: 64px;

    /* stylelint-disable selector-class-pattern */
    .react-select__indicators {
        position: absolute;
        top: 7px;
        right: 4px;
    }
`;

export const CoinmarketFormInputFiat = <TFieldValues extends CoinmarketAllFormProps>({
    cryptoInputName,
    fiatInputName,
    methods,
}: CoinmarketFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const context = useCoinmarketFormContext();
    const { amountLimits } = context;
    const {
        control,
        formState: { errors },
        trigger,
        clearErrors,
    } = methods;

    const fiatInputError =
        cryptoInputName === FORM_OUTPUT_FIAT
            ? (errors as FieldErrors<CoinmarketSellExchangeFormProps>)?.outputs?.[0]?.fiat
            : (errors as FieldErrors<CoinmarketBuyFormProps>).fiatInput;
    const cryptoInputError =
        cryptoInputName === FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<CoinmarketSellExchangeFormProps>)?.outputs?.[0]?.amount
            : undefined;

    const fiatInputRules: UseControllerProps['rules'] = {
        ...(isCoinmarketExchangeContext(context)
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
                              Number(value) < context.amountLimits.minFiat
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
                              Number(value) > context.amountLimits.maxFiat
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
            onChange={() => {
                clearErrors(cryptoInputName);
            }}
            inputState={getInputState(fiatInputError ?? cryptoInputError)}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={fiatInputError?.message ?? cryptoInputError?.message ?? null}
            innerAddon={<CoinmarketFormInputCurrencyWrapper />}
            hasBottomPadding={false}
            data-testid="@coinmarket/form/fiat-input"
        />
    );
};
