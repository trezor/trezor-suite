import { useSelector } from 'react-redux';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { getNetwork } from '@suite-common/wallet-config';
import {
    DeviceRootState,
    TransactionsRootState,
    selectIsBaseCurrencyInSats,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Input } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { selectAccountTokenDecimals } from '@suite-native/tokens';
import { BigNumber } from '@trezor/utils';

import { SendAmountCurrencyLabelWrapper } from './CryptoAmountInput';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';
import { SendAmountInputProps } from '../types';
import { getOutputFieldName } from '../utils';

export const FiatAmountInput = ({
    recipientIndex,
    inputRef,
    symbol,
    tokenContract,
    onPress,
    isDisabled = false,
    accountKey,
}: SendAmountInputProps) => {
    const { setValue } = useFormContext<SendOutputsFormValues>();
    const baseCurrencyCode = useSelector(selectLocalCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const { fiatAmountTransformer } = useAmountInputTransformers(symbol);
    const { decimals } = getNetwork(symbol);
    const tokenDecimals = useSelector(
        (state: DeviceRootState & TokenDefinitionsRootState & TransactionsRootState) =>
            selectAccountTokenDecimals(state, accountKey, tokenContract),
    );
    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const { onChange, onBlur, value } = useField({
        name: fiatFieldName,
        valueTransformer: fiatAmountTransformer,
    });

    // Validation is assigned to the crypto field, so we need to check if that field has an error.
    const { hasError } = useField({
        name: cryptoFieldName,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = fiatAmountTransformer(newValue);
        onChange(transformedValue);

        const cryptoValue = converters?.convertFiatToCrypto?.(
            asBaseCurrencyAmount(new BigNumber(transformedValue)),
        );
        if (cryptoValue) {
            const cryptoDecimals = tokenDecimals ?? decimals;
            setValue(cryptoFieldName, cryptoValue.toFixed(cryptoDecimals), {
                shouldValidate: true,
            });
        }

        setValue('setMaxOutputId', undefined);
    };

    return (
        <Input
            ref={inputRef}
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel="amount to send input"
            testID={fiatFieldName}
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={onBlur}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                    {isBaseCurrencyInSats ? 'sat' : baseCurrencyCode.toUpperCase()}
                </SendAmountCurrencyLabelWrapper>
            }
        />
    );
};
