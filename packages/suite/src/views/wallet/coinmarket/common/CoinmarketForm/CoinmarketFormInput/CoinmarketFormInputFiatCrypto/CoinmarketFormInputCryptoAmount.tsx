import { useTranslation } from 'src/hooks/suite';
import { NumberInput } from 'src/components/suite';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useFormatters } from '@suite-common/formatters';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    CoinmarketAllFormProps,
    CoinmarketBuyFormProps,
    CoinmarketFormInputFiatCryptoProps,
    CoinmarketSellExchangeFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import { FieldErrors } from 'react-hook-form';
import { coinmarketGetAccountLabel } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useDidUpdate } from '@trezor/react-utils';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_MAX } from 'src/constants/wallet/coinmarket/form';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoListProps,
} from 'src/types/coinmarket/coinmarket';
import { FormState } from '@suite-common/wallet-types';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import {
    isCoinmarketBuyContext,
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

export const CoinmarketFormInputCryptoAmount = <TFieldValues extends CoinmarketAllFormProps>({
    cryptoInputName,
    fiatInputName,
    cryptoSelectName,
    methods,
}: CoinmarketFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const context = useCoinmarketFormContext();
    const { amountLimits, account, network } = context;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const {
        control,
        formState: { errors },
        getValues,
        trigger,
        clearErrors,
    } = methods;
    const cryptoSelect = getValues(cryptoSelectName) as
        | CoinmarketCryptoListProps
        | CoinmarketAccountOptionsGroupOptionProps
        | undefined;
    const cryptoInputError =
        cryptoInputName === FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<CoinmarketSellExchangeFormProps>)?.outputs?.[0]?.amount
            : (errors as FieldErrors<CoinmarketBuyFormProps>).cryptoInput;
    const networkSymbol = cryptoSelect?.value && cryptoIdToCoinSymbol(cryptoSelect?.value);

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),

            ...(!isCoinmarketBuyContext(context)
                ? {
                      reserveOrBalance: validateReserveOrBalance(translationString, {
                          account,
                          areSatsUsed: !!shouldSendInSats,
                          tokenAddress: (getValues() as FormState).outputs?.[0]?.token,
                      }),
                  }
                : {}),
        },
    };

    useDidUpdate(() => {
        if (amountLimits) {
            trigger([cryptoInputName]);
        }
    }, [amountLimits, trigger]);

    return (
        <NumberInput
            name={cryptoInputName}
            onChange={() => {
                if (isCoinmarketSellContext(context)) {
                    context.setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                }
                if (isCoinmarketExchangeContext(context)) {
                    context.setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                }

                clearErrors(fiatInputName);
            }}
            inputState={getInputState(cryptoInputError)}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={cryptoInputError?.message || null}
            hasBottomPadding={false}
            innerAddon={
                <CoinmarketFormOptionLabel>
                    {coinmarketGetAccountLabel(
                        cryptoSelect?.value && networkSymbol ? networkSymbol : '',
                        shouldSendInSats,
                    )}
                </CoinmarketFormOptionLabel>
            }
            data-testid="@coinmarket/form/crypto-input"
        />
    );
};
