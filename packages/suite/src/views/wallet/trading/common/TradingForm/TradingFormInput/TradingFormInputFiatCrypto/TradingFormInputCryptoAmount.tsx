import { FieldErrors } from 'react-hook-form';

import { useFormatters } from '@suite-common/formatters';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingBuyFormProps,
    useTradingInfo,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { FormState } from '@suite-common/wallet-types';
import { getInputState } from '@suite-common/wallet-utils';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector, useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingCryptoListProps,
} from 'src/types/trading/trading';
import {
    TradingAllFormProps,
    TradingFormInputFiatCryptoProps,
    TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import {
    validateCryptoLimits,
    validateDecimals,
    validateInteger,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    getTradingNetworkDecimals,
    tradingGetAccountLabel,
} from 'src/utils/wallet/trading/tradingUtils';

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
        cryptoInputName === TRADING_FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : (errors as FieldErrors<TradingBuyFormProps>).cryptoInput;
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoSelect?.value);
    const displaySymbol = tradingGetAccountLabel(
        getDisplaySymbol(coinSymbol ?? '', contractAddress),
        shouldSendInSats,
    );
    const decimals = getTradingNetworkDecimals({
        sendCryptoSelect: !isTradingBuyContext(context)
            ? context.getValues()[TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]
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
                    context.setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                    context.form.helpers.setFractionButton(undefined);
                }
                if (isTradingExchangeContext(context)) {
                    context.setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                    context.form.helpers.setFractionButton(undefined);
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
