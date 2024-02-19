import { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';

import { Button, PinButton, KEYBOARD_CODE } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { formInputsMaxLength } from '@suite-common/validators';
import { InputPin } from './InputPin';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

const InputWrapper = styled.div`
    margin-bottom: 12px;
    width: 100%;
`;

const Expander = styled.div`
    flex: 1;
`;

const PinRow = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

const PinFooter = styled.div`
    display: flex;
    width: 100%;
    margin-top: 20px;
    flex-direction: column;
`;

const StyledPinButton = styled(PinButton)<{ blur?: boolean }>`
    ${props =>
        props.blur &&
        css`
            filter: blur(5px);
            pointer-events: none;
        `}
`;

interface PinInputProps {
    isSubmitting: boolean;
    onPinSubmit: (pin: string) => void;
}

export const PinInput = ({ isSubmitting, onPinSubmit }: PinInputProps) => {
    const [pin, setPin] = useState('');

    const onPinBackspace = useCallback(() => {
        setPin(prevPin => prevPin.substring(0, prevPin.length - 1));
    }, []);

    const onPinAdd = useCallback(
        (input: string) => {
            if (pin.length < formInputsMaxLength.pin) {
                setPin(pin + input);
            }
        },
        [pin],
    );

    const submit = useCallback(() => {
        onPinSubmit(pin);
        setPin('');
    }, [onPinSubmit, setPin, pin]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            switch (event.code) {
                case KEYBOARD_CODE.ENTER:
                case KEYBOARD_CODE.NUMPAD_ENTER:
                    submit();
                    break;
                case KEYBOARD_CODE.BACK_SPACE:
                    onPinBackspace();
                    break;

                // numeric and numpad
                case KEYBOARD_CODE.DIGIT_ONE:
                case KEYBOARD_CODE.NUMPAD_ONE:
                    onPinAdd('1');
                    break;
                case KEYBOARD_CODE.DIGIT_TWO:
                case KEYBOARD_CODE.NUMPAD_TWO:
                    onPinAdd('2');
                    break;
                case KEYBOARD_CODE.DIGIT_THREE:
                case KEYBOARD_CODE.NUMPAD_THREE:
                    onPinAdd('3');
                    break;
                case KEYBOARD_CODE.DIGIT_FOUR:
                case KEYBOARD_CODE.NUMPAD_FOUR:
                    onPinAdd('4');
                    break;
                case KEYBOARD_CODE.DIGIT_FIVE:
                case KEYBOARD_CODE.NUMPAD_FIVE:
                    onPinAdd('5');
                    break;
                case KEYBOARD_CODE.DIGIT_SIX:
                case KEYBOARD_CODE.NUMPAD_SIX:
                    onPinAdd('6');
                    break;
                case KEYBOARD_CODE.DIGIT_SEVEN:
                case KEYBOARD_CODE.NUMPAD_SEVEN:
                    onPinAdd('7');
                    break;
                case KEYBOARD_CODE.DIGIT_EIGHT:
                case KEYBOARD_CODE.NUMPAD_EIGHT:
                    onPinAdd('8');
                    break;
                case KEYBOARD_CODE.DIGIT_NINE:
                case KEYBOARD_CODE.NUMPAD_NINE:
                    onPinAdd('9');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [onPinAdd, onPinBackspace, submit]);

    return (
        <Wrapper data-test-id="@pin">
            <InputWrapper>
                <InputPin value={pin} onDeleteClick={() => onPinBackspace()} />
            </InputWrapper>
            <PinRow>
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="7"
                    onClick={() => onPinAdd('7')}
                    data-test-id="@pin/input/7"
                />
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="8"
                    onClick={() => onPinAdd('8')}
                    data-test-id="@pin/input/8"
                />
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="9"
                    onClick={() => onPinAdd('9')}
                    data-test-id="@pin/input/9"
                />
            </PinRow>
            <PinRow>
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="4"
                    onClick={() => onPinAdd('4')}
                    data-test-id="@pin/input/4"
                />
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="5"
                    onClick={() => onPinAdd('5')}
                    data-test-id="@pin/input/5"
                />
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="6"
                    onClick={() => onPinAdd('6')}
                    data-test-id="@pin/input/6"
                />
            </PinRow>
            <PinRow>
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="1"
                    onClick={() => onPinAdd('1')}
                    data-test-id="@pin/input/1"
                />

                <StyledPinButton
                    blur={isSubmitting}
                    data-value="2"
                    onClick={() => onPinAdd('2')}
                    data-test-id="@pin/input/2"
                />
                <StyledPinButton
                    blur={isSubmitting}
                    data-value="3"
                    onClick={() => onPinAdd('3')}
                    data-test-id="@pin/input/3"
                />
            </PinRow>

            <Expander />
            <PinFooter>
                <Button
                    variant="primary"
                    isDisabled={isSubmitting}
                    isFullWidth
                    onClick={submit}
                    data-test-id="@pin/submit-button"
                >
                    {isSubmitting ? (
                        <Translation id="TR_VERIFYING_PIN" />
                    ) : (
                        <Translation id="TR_ENTER_PIN" />
                    )}
                </Button>
            </PinFooter>
        </Wrapper>
    );
};
