import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Input, KEYBOARD_CODE } from '@trezor/components';
import { useSavingsPhoneNumberVerificationContext } from '@wallet-hooks/coinmarket/savings/useSavingsPhoneNumberVerification';
import { Translation } from '@suite-components';
import type { CodeDigitIndex } from '@wallet-types/coinmarket/savings/phoneNumberVerification';

const StyledInput = styled(Input)`
    font-size: 24px;
    line-height: 24px;
    text-align: center;
`;

const getVerificationCodeInputSelector = (index: number) => `input[data-input-index='${index}']`;

interface VerificationCodeDigitInputProps {
    index: CodeDigitIndex;
}

const VerificationCodeDigitInput = ({ index }: VerificationCodeDigitInputProps) => {
    const { register, error, formState, trigger } = useSavingsPhoneNumberVerificationContext();
    const { isSubmitSuccessful } = formState;

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            // focus of next input on change to non-empty value in currently changed input
            if (error && !isSubmitSuccessful) {
                trigger();
            }
            if (event.currentTarget.value) {
                const nextInputIndex = Number(event.currentTarget.dataset.inputIndex) + 1;
                const nextInputSelector = getVerificationCodeInputSelector(nextInputIndex);
                const nextInput = document.querySelector(nextInputSelector) as
                    | HTMLInputElement
                    | undefined;
                if (nextInput) {
                    nextInput.focus();
                }
            }
        },
        [error, isSubmitSuccessful, trigger],
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        // focus of previous input on deleting code digit from current input with backspace key
        if (KEYBOARD_CODE.BACK_SPACE === event.code) {
            const currentInputIndex = Number(event.currentTarget.dataset.inputIndex);
            const previousInputIndex = Number(event.currentTarget.dataset.inputIndex) - 1;

            const currentInputSelector = getVerificationCodeInputSelector(currentInputIndex);
            const previousInputSelector = getVerificationCodeInputSelector(previousInputIndex);

            const currentInput = document.querySelector(currentInputSelector) as
                | HTMLInputElement
                | undefined;
            const previousInput = document.querySelector(previousInputSelector) as
                | HTMLInputElement
                | undefined;

            if (previousInput && !currentInput?.value) {
                previousInput.focus();
            }
        }
    }, []);

    const label =
        index === 0 ? <Translation id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_LABEL" /> : '';

    const name = `codeDigitIndex${index}`;
    return (
        <StyledInput
            noError
            autoFocus={index === 0}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            width={61}
            label={label}
            name={name}
            data-input-index={index}
            maxLength={1}
            innerRef={register({
                required: 'TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_IS_REQUIRED',
                pattern: {
                    value: /[0-9]{1}/,
                    message: 'TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_MUST_BE_NUMBER',
                },
            })}
        />
    );
};

export default VerificationCodeDigitInput;
