import React, { KeyboardEvent, useEffect } from 'react';
import { ButtonPin, Button } from '@trezor/components';
import { Modal } from '../../types';

interface Props {
    modal: Modal;
}

const Pin: React.FC<Props> = props => {
    const { onPinAdd, onPinBackspace, onPinSubmit } = props.modalActions;
    const { pin } = props.modal;

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
                    onPinAdd(1);
                    break;
                case 50:
                case 98:
                    onPinAdd(2);
                    break;
                case 51:
                case 99:
                    onPinAdd(3);
                    break;
                case 52:
                case 100:
                    onPinAdd(4);
                    break;
                case 53:
                case 101:
                    onPinAdd(5);
                    break;
                case 54:
                case 102:
                    onPinAdd(6);
                    break;
                case 55:
                case 103:
                    onPinAdd(7);
                    break;
                case 56:
                case 104:
                    onPinAdd(8);
                    break;
                case 57:
                case 105:
                    onPinAdd(9);
                    break;
                default:
                // do nothing.
            }
        };
        window.addEventListener('keydown', keyboardHandler, false);
        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="pin">
            <h3>Please enter your PIN.</h3>
            <h4>Look at the device for number positions.</h4>
            <div className="pin_row">
                <ButtonPin data-value="7" onClick={() => onPinAdd(7)} />
                <ButtonPin data-value="8" onClick={() => onPinAdd(8)} />
                <ButtonPin data-value="9" onClick={() => onPinAdd(9)} />
            </div>
            <div className="pin_row">
                <ButtonPin data-value="4" onClick={() => onPinAdd(4)} />
                <ButtonPin data-value="5" onClick={() => onPinAdd(5)} />
                <ButtonPin data-value="6" onClick={() => onPinAdd(6)} />
            </div>
            <div className="pin_row">
                <ButtonPin data-value="1" onClick={() => onPinAdd(1)} />
                <ButtonPin data-value="2" onClick={() => onPinAdd(2)} />
                <ButtonPin data-value="3" onClick={() => onPinAdd(3)} />
            </div>
            <div className="pin_input_row">
                <input
                    type="password"
                    className="input"
                    autoComplete="off"
                    maxLength={9}
                    disabled
                    value={pin}
                />
                <button className="pin_backspace" onClick={() => onPinBackspace()} type="button">
                    &#9003;
                </button>
            </div>
            <div>
                <Button className="submit" onClick={() => onPinSubmit(pin)}>
                    Enter
                </Button>
            </div>
        </div>
    );
};

export default Pin;
