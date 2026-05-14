import React, { useEffect } from 'react';
import { type FieldValues } from 'react-hook-form';

import styled from 'styled-components';

import {
    Column,
    FractionButton,
    type FractionButtonProps,
    Row,
    TextButton,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { NumberInput, type NumberInputProps } from '../NumberInput/NumberInput';

const InputWithOptionsContainer = styled.div`
    width: 100%;
`;

export type InputWithOptionsProps<TFieldValues extends FieldValues> = {
    cryptoInputProps: NumberInputProps<TFieldValues>;
    fiatInputProps?: NumberInputProps<TFieldValues>;
    fiatValue?: React.ReactNode;
    options: FractionButtonProps[];
    switchTranslation?: {
        fiat: React.ReactNode;
        crypto: React.ReactNode;
    };
    onCurrencyChange?: (currency: 'crypto' | 'fiat') => void;
    'data-testid'?: string;
};

export const InputWithOptions = <TFieldValues extends FieldValues>({
    cryptoInputProps,
    fiatInputProps,
    fiatValue,
    options,
    switchTranslation,
    onCurrencyChange,
    'data-testid': dataTest,
}: InputWithOptionsProps<TFieldValues>) => {
    const [amountInCrypto, setAmountInCrypto] = React.useState(true);

    useEffect(() => {
        const currency = amountInCrypto ? 'crypto' : 'fiat';
        onCurrencyChange?.(currency);
    }, [amountInCrypto, onCurrencyChange]);

    const canSwitchInputs = fiatInputProps != null;

    const labelRight =
        canSwitchInputs && switchTranslation != null ? (
            <TextButton
                data-testid={`${dataTest}/switch-inputs`}
                size="small"
                onClick={() => setAmountInCrypto(prevValue => !prevValue)}
                type="button"
            >
                {amountInCrypto ? switchTranslation.fiat : switchTranslation.crypto}
            </TextButton>
        ) : null;

    const cryptoNumberInput = (
        <NumberInput
            data-testid={`${dataTest}/crypto-input`}
            key={cryptoInputProps.name}
            labelRight={labelRight}
            {...cryptoInputProps}
        />
    );

    const fiatNumberInput = canSwitchInputs ? (
        <NumberInput
            data-testid={`${dataTest}/fiat-input`}
            key={fiatInputProps.name}
            labelRight={labelRight}
            {...fiatInputProps}
        />
    ) : null;

    const numberInputs = canSwitchInputs && !amountInCrypto ? fiatNumberInput : cryptoNumberInput;

    return (
        <InputWithOptionsContainer>
            <Column gap={spacings.xs}>
                {numberInputs}
                <Row justifyContent="space-between">
                    <Row gap={spacings.xs} data-testid={`${dataTest}/fraction-buttons`}>
                        {options.map(button => (
                            <FractionButton key={button.id} {...button} />
                        ))}
                    </Row>
                    {amountInCrypto ? fiatValue : null}
                </Row>
            </Column>
        </InputWithOptionsContainer>
    );
};
