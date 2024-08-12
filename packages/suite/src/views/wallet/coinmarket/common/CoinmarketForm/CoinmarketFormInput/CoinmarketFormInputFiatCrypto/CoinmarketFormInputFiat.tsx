import { useTranslation } from 'src/hooks/suite';
import { NumberInput } from 'src/components/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useDidUpdate } from '@trezor/react-utils';
import CoinmarketFormInputCurrency from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';
import { CoinmarketFormInputFiatCryptoProps } from 'src/types/coinmarket/coinmarketForm';
import styled from 'styled-components';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { FieldError, FieldValues, UseControllerProps } from 'react-hook-form';

const CoinmarketFormInputCurrencyWrapper = styled(CoinmarketFormInputCurrency)`
    width: 64px;

    /* stylelint-disable selector-class-pattern */
    .react-select__indicators {
        position: absolute;
        top: 7px;
        right: 4px;
    }
`;

const CoinmarketFormInputFiat = <TFieldValues extends FieldValues>({
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
    const fiatInputError = errors[fiatInputName] as FieldError;

    const fiatInputRules: UseControllerProps['rules'] = {
        ...(isCoinmarketExchangeOffers(context)
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
        trigger(fiatInputName);
    }, [amountLimits, trigger]);

    return (
        <NumberInput
            name={fiatInputName}
            onChange={() => {
                clearErrors(cryptoInputName);
            }}
            inputState={getInputState(fiatInputError)}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={fiatInputError?.message || null}
            innerAddon={<CoinmarketFormInputCurrencyWrapper />}
            hasBottomPadding={false}
            data-testid="@coinmarket/form/fiat-input"
        />
    );
};

export default CoinmarketFormInputFiat;
