import React, { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Button, ButtonPin } from '@trezor/components';
import InputPin from './components/InputPin';
import { Translation } from '@suite-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { KEY_CODE } from '@suite/constants/suite';

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

const StyledButtonPin = styled(ButtonPin)<{ blur?: boolean }>`
    ${props =>
        props.blur &&
        css`
            filter: blur(5px);
            pointer-events: none;
        `}
`;

interface Props {
    isSubmitting: boolean;
    onPinSubmit: (pin: string) => void;
}

const PinInput = ({ isSubmitting, onPinSubmit }: Props) => {
    const [pin, setPin] = useState('');

    const onPinBackspace = useCallback(() => {
        setPin(prevPin => prevPin.substring(0, prevPin.length - 1));
    }, []);

    const onPinAdd = useCallback(
        (input: string) => {
            if (pin.length < MAX_LENGTH.PIN) {
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
            event.preventDefault();
            switch (event.code) {
                case KEY_CODE.CODE_RETURN:
                    // enter,
                    submit();
                    break;
                // backspace
                case KEY_CODE.CODE_BACK_SPACE:
                    onPinBackspace();
                    break;

                // numeric and numpad
                case KEY_CODE.CODE_1:
                case KEY_CODE.CODE_NUMPAD1:
                    onPinAdd('1');
                    break;
                case KEY_CODE.CODE_2:
                case KEY_CODE.CODE_NUMPAD2:
                    onPinAdd('2');
                    break;
                case KEY_CODE.CODE_3:
                case KEY_CODE.CODE_NUMPAD3:
                    onPinAdd('3');
                    break;
                case KEY_CODE.CODE_4:
                case KEY_CODE.CODE_NUMPAD4:
                    onPinAdd('4');
                    break;
                case KEY_CODE.CODE_5:
                case KEY_CODE.CODE_NUMPAD5:
                    onPinAdd('5');
                    break;
                case KEY_CODE.CODE_6:
                case KEY_CODE.CODE_NUMPAD6:
                    onPinAdd('6');
                    break;
                case KEY_CODE.CODE_7:
                case KEY_CODE.CODE_NUMPAD7:
                    onPinAdd('7');
                    break;
                case KEY_CODE.CODE_8:
                case KEY_CODE.CODE_NUMPAD8:
                    onPinAdd('8');
                    break;
                case KEY_CODE.CODE_9:
                case KEY_CODE.CODE_NUMPAD9:
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
        <Wrapper data-test="@pin">
            <InputWrapper>
                <InputPin value={pin} onDeleteClick={() => onPinBackspace()} />
            </InputWrapper>
            <PinRow>
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="7"
                    onClick={() => onPinAdd('7')}
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="8"
                    onClick={() => onPinAdd('8')}
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="9"
                    onClick={() => onPinAdd('9')}
                />
            </PinRow>
            <PinRow>
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="4"
                    onClick={() => onPinAdd('4')}
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="5"
                    onClick={() => onPinAdd('5')}
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="6"
                    onClick={() => onPinAdd('6')}
                />
            </PinRow>
            <PinRow>
                <StyledButtonPin
                    type="button"
                    blur={isSubmitting}
                    data-value="1"
                    onClick={() => onPinAdd('1')}
                    data-test="@pin/input/1"
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="2"
                    onClick={() => onPinAdd('2')}
                />
                <StyledButtonPin
                    blur={isSubmitting}
                    type="button"
                    data-value="3"
                    onClick={() => onPinAdd('3')}
                />
            </PinRow>

            <Expander />
            <PinFooter>
                <Button
                    variant="primary"
                    isDisabled={isSubmitting}
                    fullWidth
                    onClick={submit}
                    data-test="@pin/submit-button"
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

export default PinInput;
