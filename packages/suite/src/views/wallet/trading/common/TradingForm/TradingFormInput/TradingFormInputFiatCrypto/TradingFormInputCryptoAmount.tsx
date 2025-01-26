import { FieldErrors } from 'react-hook-form';

import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useFormatters } from '@suite-common/formatters';
import { FormState } from '@suite-common/wallet-types';
import { useDidUpdate } from '@trezor/react-utils';
import { NumberInput } from '@trezor/product-components';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { useSelector, useTranslation } from 'src/hooks/suite';
import {
    validateDecimals,
    validateInteger,
    validateCryptoLimits,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    TradingAllFormProps,
    TradingBuyFormProps,
    TradingFormInputFiatCryptoProps,
    TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import {
    tradingGetAccountLabel,
    getTradingNetworkDecimals,
} from 'src/utils/wallet/trading/tradingUtils';
import {
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_MAX,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/trading/form';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingCryptoListProps,
} from 'src/types/trading/trading';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

export const TradingFormInputCryptoAmount = <TFieldValues extends TradingAllFormProps>({
    cryptoInputName,
    fiatInputName,
    cryptoSelectName,
    methods,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);

    const context = useTradingFormContext();
    const { amountLimits, account, network } = context;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const {
        control,
        formState: { errors },
        getValues,
        trigger,
        clearErrors,
    } = methods;
    const cryptoSelect = getValues(cryptoSelectName) as
        | TradingCryptoListProps
        | TradingAccountOptionsGroupOptionProps
        | undefined;
    const cryptoInputError =
        cryptoInputName === FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : (errors as FieldErrors<TradingBuyFormProps>).cryptoInput;
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoSelect?.value);
    const displaySymbol = tradingGetAccountLabel(
        getDisplaySymbol(coinSymbol ?? '', contractAddress),
        shouldSendInSats,
    );
    const decimals = getTradingNetworkDecimals({
        sendCryptoSelect: !isTradingBuyContext(context)
            ? context.getValues()[FORM_SEND_CRYPTO_CURRENCY_SELECT]
            : undefined,
        network,
    });

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals }),
            limits: validateCryptoLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),

            ...(!isTradingBuyContext(context)
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
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            onChange={() => {
                if (isTradingSellContext(context)) {
                    context.setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                }
                if (isTradingExchangeContext(context)) {
                    context.setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                }

                clearErrors(fiatInputName);
            }}
            inputState={getInputState(cryptoInputError)}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={cryptoInputError?.message || null}
            innerAddon={<>{displaySymbol}</>}
            data-testid="@trading/form/crypto-input"
        />
    );
};
