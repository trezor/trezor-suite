import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm, useFormState, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import {
    CONTRACT_ADDRESS_FOR_NATIVE_TOKEN,
    TRADING_FORM_AMOUNT_INPUT_SOURCE,
    TRADING_FORM_AMOUNT_IN_CRYPTO,
    TRADING_FORM_OUTPUT_MAX,
    getNetworkDecimalsWithFallback,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency, getFiatRateKey } from '@suite-common/wallet-utils';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Row, Skeleton, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
} from 'src/types/trading/tradingForm';
import { isTradingExchangeOrSellContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import {
    TRADING_BASE_CURRENCY_SKELETON_WIDTH,
    getTradingBaseCurrencyAmountFromCrypto,
    getTradingCryptoAmountFromBaseCurrency,
} from '../../tradingFormInputsUtils';

const BASE_CURRENCY_AMOUNT_FIELD = 'baseCurrencyAmount';

type BaseCurrencyAmountForm = {
    [BASE_CURRENCY_AMOUNT_FIELD]: string;
};

type TradingFormInputBaseCurrencyAmountProps = Pick<
    TradingFormInputFiatCryptoProps,
    'cryptoInputName' | 'fiatInputName'
> & {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    decimals?: number;
    isInSats?: boolean;
};

export const TradingFormInputBaseCurrencyAmount = ({
    cryptoInputName,
    fiatInputName,
    symbol,
    tokenAddress,
    decimals = getNetworkDecimalsWithFallback(symbol),
    isInSats = false,
}: TradingFormInputBaseCurrencyAmountProps) => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isNativeToken = !tokenAddress || tokenAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
    const rate = useSelector(
        (state: FiatRatesRootState) =>
            selectFiatRatesByFiatRateKey(
                state,
                getFiatRateKey(symbol, baseCurrency, isNativeToken ? undefined : tokenAddress),
                'current',
            )?.rate,
    );

    const context = useTradingFormContext();
    const { control, getValues, setValue, clearErrors, getFieldState } =
        context as UseFormReturn<TradingAllFormProps>;
    const formState = useFormState({ control, name: [cryptoInputName, fiatInputName] });
    const hasError =
        getFieldState(cryptoInputName, formState).invalid ||
        getFieldState(fiatInputName, formState).invalid;
    const setFractionButton = isTradingExchangeOrSellContext(context)
        ? context.form.helpers.setFractionButton
        : undefined;
    const cryptoAmount = useWatch({ control, name: cryptoInputName });
    const amountInCrypto = useWatch({ control, name: TRADING_FORM_AMOUNT_IN_CRYPTO });

    const baseCurrencyForm = useForm<BaseCurrencyAmountForm>({
        defaultValues: { [BASE_CURRENCY_AMOUNT_FIELD]: '' },
    });
    const writtenCryptoAmountRef = useRef<string | undefined>(undefined);

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrency,
        isInSats: false,
    });

    const currencyLabel = useMemo(() => {
        const currencyCode = baseCurrency.toUpperCase();

        if (!isFiatBaseCurrencyCode(baseCurrency)) {
            return currencyCode;
        }

        return (
            new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })
                .formatToParts(0)
                .find(part => part.type === 'currency')?.value ?? currencyCode
        );
    }, [baseCurrency, locale]);

    useEffect(() => {
        if (cryptoAmount === writtenCryptoAmountRef.current) {
            return;
        }

        writtenCryptoAmountRef.current = undefined;
        baseCurrencyForm.setValue(
            BASE_CURRENCY_AMOUNT_FIELD,
            getTradingBaseCurrencyAmountFromCrypto({
                cryptoAmount: cryptoAmount ?? '',
                rate,
                decimals,
                isInSats,
                baseCurrencyDecimals,
            }),
        );
    }, [cryptoAmount, rate, decimals, isInSats, baseCurrencyDecimals, baseCurrencyForm]);

    const handleChange = useCallback(
        (baseCurrencyAmount: string) => {
            const nextCryptoAmount = getTradingCryptoAmountFromBaseCurrency({
                baseCurrencyAmount,
                rate,
                decimals,
                isInSats,
            });

            setValue(TRADING_FORM_AMOUNT_INPUT_SOURCE, 'base-currency');

            if (setFractionButton) {
                setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                setFractionButton(undefined);
            }

            if (!getValues(TRADING_FORM_AMOUNT_IN_CRYPTO)) {
                setValue(TRADING_FORM_AMOUNT_IN_CRYPTO, true, { shouldDirty: true });
            }

            if (getValues(fiatInputName)) {
                setValue(fiatInputName, '', { shouldDirty: true });
            }

            clearErrors(fiatInputName);
            writtenCryptoAmountRef.current = nextCryptoAmount;
            setValue(cryptoInputName, nextCryptoAmount, {
                shouldValidate: true,
                shouldDirty: true,
            });
        },
        [
            rate,
            decimals,
            isInSats,
            setFractionButton,
            getValues,
            setValue,
            clearErrors,
            fiatInputName,
            cryptoInputName,
        ],
    );

    if (!amountInCrypto && context.form.state.isFormLoading) {
        return <Skeleton animate width={TRADING_BASE_CURRENCY_SKELETON_WIDTH} />;
    }

    return (
        <Row
            gap={4}
            flex="1"
            minWidth={0}
            alignItems="center"
            cursor="text"
            onClick={() => baseCurrencyForm.setFocus(BASE_CURRENCY_AMOUNT_FIELD)}
            data-testid="@trading/form/base-currency-zone"
        >
            <Text
                typographyStyle="body-sm"
                intent={hasError ? 'critical' : 'neutral'}
                priority={hasError ? 'primary' : 'secondary'}
                data-testid="@trading/form/base-currency-label"
            >
                {currencyLabel}
            </Text>
            <NumberInput
                isClean
                size="small"
                flex="1"
                name={BASE_CURRENCY_AMOUNT_FIELD}
                placeholder="0"
                style={{ color: hasError ? theme.contentCritical : undefined }}
                locale={locale}
                onChange={handleChange}
                isDisabled={!rate}
                control={baseCurrencyForm.control}
                maxLength={formInputsMaxLength.amount}
                data-testid="@trading/form/base-currency-input"
            />
        </Row>
    );
};
