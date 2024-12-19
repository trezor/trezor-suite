import React from 'react';
import { FieldValues } from 'react-hook-form';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';
import { Column, Row, FractionButtonProps, FractionButton, TextButton } from '@trezor/components';

import { NumberInput, NumberInputProps } from '../NumberInput/NumberInput';

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
};

export const InputWithOptions = <TFieldValues extends FieldValues>({
    cryptoInputProps,
    fiatInputProps,
    fiatValue,
    options,
    switchTranslation,
}: InputWithOptionsProps<TFieldValues>) => {
    const [amountInCrypto, setAmountInCrypto] = React.useState(true);

    const canSwitchInputs = fiatInputProps != null;

    const labelRight =
        canSwitchInputs && switchTranslation != null ? (
            <TextButton
                size="small"
                onClick={() => setAmountInCrypto(prevValue => !prevValue)}
                type="button"
            >
                {amountInCrypto ? switchTranslation.fiat : switchTranslation.crypto}
            </TextButton>
        ) : null;

    const cryptoNumberInput = (
        <NumberInput key={cryptoInputProps.name} labelRight={labelRight} {...cryptoInputProps} />
    );

    const fiatNumberInput = canSwitchInputs ? (
        <NumberInput key={fiatInputProps.name} labelRight={labelRight} {...fiatInputProps} />
    ) : null;

    const numberInputs = canSwitchInputs && !amountInCrypto ? fiatNumberInput : cryptoNumberInput;

    return (
        <InputWithOptionsContainer>
            <Column gap={spacings.xs}>
                {numberInputs}
                <Row justifyContent="space-between">
                    <Row gap={spacings.xs}>
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
