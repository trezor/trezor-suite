import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { BaseAmountInputs, Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { TokenAmountFormatter, useCryptoFiatConverters } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { AMOUNT_INPUT_UNFOCUSED_OFFSET, AMOUNT_INPUT_WRAPPER_HEIGHT } from '../constants';
import { type YieldDepositFormValues } from '../yieldDepositFormSchema';
import { EarnAmountErrorMessage } from './EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from './EarnCryptoAmountInput';
import { EarnFiatAmountInput } from './EarnFiatAmountInput';

type WrappedNativeTokenAmountInputCardProps = {
    amountLabel: ReactNode;
    balance: string;
    maxAmount?: string;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    tokenSymbol: TokenSymbol;
};

export const WrappedNativeTokenAmountInputCard = ({
    amountLabel,
    balance,
    maxAmount,
    symbol,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
}: WrappedNativeTokenAmountInputCardProps) => {
    const { setValue } = useFormContext<YieldDepositFormValues>();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const handleMaxPress = () => {
        const value = maxAmount ?? balance;
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
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <BaseAmountInputs
                    symbol={symbol}
                    unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                    wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                    renderTopRow={() => <Text variant="body-sm">{amountLabel}</Text>}
                    renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnCryptoAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            displaySymbol={tokenSymbol}
                            accessibilityLabel="amount input"
                            inputRef={inputRef}
                            isDisabled={isDisabled}
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
                            isDisabled={isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderErrorMessage={isFiatDisplayed => (
                        <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                    )}
                />
                <HStack spacing="sp8" alignItems="center">
                    <HStack spacing="sp4" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.yieldDepositFlowScreen.balance" />
                        </Text>
                        <TokenAmountFormatter
                            value={balance}
                            tokenSymbol={tokenSymbol}
                            variant="body-sm"
                            color="contentSecondary"
                        />
                    </HStack>
                    <Button
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        onPress={handleMaxPress}
                        testID="@wrapped-native-token/max-button"
                    >
                        <Translation id="earn.wrappedNativeToken.maxButton" />
                    </Button>
                </HStack>
            </VStack>
        </Card>
    );
};
