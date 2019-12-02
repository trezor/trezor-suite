import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button, ButtonPin, InputPin } from '@trezor/components';

import { Translation } from '@suite-components/Translation';

import globalMessages from '@suite-support/Messages';

const Wrapper = styled.div`
    max-width: 240px;
    margin-left: auto;
    margin-right: auto;
`;

const InputWrapper = styled.div`
    margin-top: 12px;
    margin-bottom: 12px;
`;

const PinRow = styled.div`
    display: flex;
    justify-content: space-between;
    button {
        width: 30%;
        height: 0;
        padding-bottom: 30%;
    }

    & + & {
        margin-top: 10px;
    }
`;

const PinFooter = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

interface Props {
    onPinSubmit: (pin: string) => void;
}

const PinInput = (props: Props) => {
    const { onPinSubmit } = props;

    const [pin, setPin] = useState('');

    const onPinAdd = useCallback(
        (input: string) => {
            if (pin.length < 9) {
                setPin(pin + input);
            }
        },
        [pin, setPin],
    );

    const onPinBackspace = () => {
        setPin(prevPin => prevPin.substring(0, prevPin.length - 1));
    };

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            event.preventDefault();
            switch (event.keyCode) {
                case 13:
                    // enter,
                    onPinSubmit(pin);
                    break;
                // backspace
                case 8:
                    onPinBackspace();
                    break;

                // numeric and numpad
                case 49:
                case 97:
                    onPinAdd('1');
                    break;
                case 50:
                case 98:
                    onPinAdd('2');
                    break;
                case 51:
                case 99:
                    onPinAdd('3');
                    break;
                case 52:
                case 100:
                    onPinAdd('4');
                    break;
                case 53:
                case 101:
                    onPinAdd('5');
                    break;
                case 54:
                case 102:
                    onPinAdd('6');
                    break;
                case 55:
                case 103:
                    onPinAdd('7');
                    break;
                case 56:
                case 104:
                    onPinAdd('8');
                    break;
                case 57:
                case 105:
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
    }, [pin, onPinSubmit, onPinAdd]);

    return (
        <Wrapper>
            <InputWrapper>
                <InputPin value={pin} onDeleteClick={() => onPinBackspace()} />
            </InputWrapper>
            <PinRow>
                <ButtonPin type="button" data-value="7" onClick={() => onPinAdd('7')} />
                <ButtonPin type="button" data-value="8" onClick={() => onPinAdd('8')} />
                <ButtonPin type="button" data-value="9" onClick={() => onPinAdd('9')} />
            </PinRow>
            <PinRow>
                <ButtonPin type="button" data-value="4" onClick={() => onPinAdd('4')} />
                <ButtonPin type="button" data-value="5" onClick={() => onPinAdd('5')} />
                <ButtonPin type="button" data-value="6" onClick={() => onPinAdd('6')} />
            </PinRow>
            <PinRow>
                <ButtonPin type="button" data-value="1" onClick={() => onPinAdd('1')} />
                <ButtonPin type="button" data-value="2" onClick={() => onPinAdd('2')} />
                <ButtonPin type="button" data-value="3" onClick={() => onPinAdd('3')} />
            </PinRow>

            <PinFooter>
                <Button onClick={() => onPinSubmit(pin)}>
                    <Translation {...globalMessages.TR_ENTER_PIN} />
                </Button>
            </PinFooter>
        </Wrapper>
    );
};

export default PinInput;
