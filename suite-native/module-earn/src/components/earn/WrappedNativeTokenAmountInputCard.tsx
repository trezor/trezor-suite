import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { type ActiveView, BaseAmountInputs, Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
    useCryptoFiatConverters,
} from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EarnAmountErrorMessage } from './EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from './EarnCryptoAmountInput';
import { EarnFiatAmountInput } from './EarnFiatAmountInput';
import { EarnMaxSwitch } from './EarnMaxSwitch';
import { AMOUNT_INPUT_UNFOCUSED_OFFSET, AMOUNT_INPUT_WRAPPER_HEIGHT } from '../../constants';
import { type YieldDepositFormValues } from '../../utils/yield/yieldDepositFormSchema';

type WrappedNativeTokenAmountInputCardProps = {
    amountLabel: ReactNode;
    balance: string;
    defaultAmount?: string;
    maxAmount?: string;
    onCurrencyChange?: (activeView: ActiveView) => void;
    onMaxPress?: () => void;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    tokenSymbol: TokenSymbol;
};

export const WrappedNativeTokenAmountInputCard = ({
    amountLabel,
    balance,
    defaultAmount,
    maxAmount,
    onCurrencyChange,
    onMaxPress,
    symbol,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
}: WrappedNativeTokenAmountInputCardProps) => {
    const { setValue, trigger } = useFormContext<YieldDepositFormValues>();
    const [isMaxSelected, setIsMaxSelected] = useState(false);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const converters = useCryptoFiatConverters({ symbol, tokenContract });
    const hasPrefilledRef = useRef(false);

    const setAmountWithFiat = useCallback(
        (value: string) => {
            setValue('amount', value, { shouldValidate: true });

            const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(value));
            if (fiatValue && !fiatValue.isNaN()) {
                setValue(
                    'fiat',
                    fiatValue.toFixed(
                        getDecimalsForBaseCurrency({
                            code: baseCurrencyCode,
                            isInSats: isBaseCurrencyInSats,
                        }),
                    ),
                );
            }

            // setValue alone does not refresh formState.isValid here, so a prefilled or maxed
            // amount would keep the submit button disabled until the user typed.
            void trigger('amount');
        },
        [baseCurrencyCode, converters, isBaseCurrencyInSats, setValue, trigger],
    );

    useEffect(() => {
        if (!defaultAmount || hasPrefilledRef.current) {
            return;
        }

        hasPrefilledRef.current = true;
        setAmountWithFiat(defaultAmount);
    }, [defaultAmount, setAmountWithFiat]);

    const handleMaxChange = (value: boolean) => {
        setIsMaxSelected(value);

        if (!value) {
            setValue('amount', '', { shouldValidate: false });
            setValue('fiat', '', { shouldValidate: false });

            return;
        }

        onMaxPress?.();
        setAmountWithFiat(maxAmount ?? balance);
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <BaseAmountInputs
                    symbol={symbol}
                    onInputSwitch={onCurrencyChange}
                    unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                    wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                    renderTopRow={() => (
                        <>
                            <Text variant="body-sm">{amountLabel}</Text>
                            <EarnMaxSwitch
                                isChecked={isMaxSelected}
                                onChange={handleMaxChange}
                                testID="@wrapped-native-token/max-switch"
                            />
                        </>
                    )}
                    renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnCryptoAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            tokenDecimals={tokenDecimals}
                            displaySymbol={tokenSymbol}
                            accessibilityLabel="amount input"
                            inputRef={inputRef}
                            isDisabled={isMaxSelected || isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnFiatAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            tokenDecimals={tokenDecimals}
                            accessibilityLabel="fiat amount input"
                            inputRef={inputRef}
                            isDisabled={isMaxSelected || isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderErrorMessage={isFiatDisplayed => (
                        <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                    )}
                />
                <HStack spacing="sp4" alignItems="center">
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id="earn.yieldDepositFlowScreen.balance" />
                    </Text>
                    <CompactTokenAmountFormatter
                        value={asDecimalTokenAmount(balance)}
                        tokenSymbol={tokenSymbol}
                        tokenDecimals={tokenDecimals}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                </HStack>
            </VStack>
        </Card>
    );
};
