/* @flow */
'use strict';

import React, { Component, KeyboardEvent } from 'react';

export default class Pin extends Component {

    componentWillMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent): void {
        const { onPinAdd, onPinBackspace, onPinSubmit } = this.props.modalActions;
        const { pin } = this.props.modal;

        event.preventDefault();
        switch (event.keyCode) {
            case 13 :
                // enter,
                onPinSubmit(pin);
                break;
            // backspace
            case 8 :
                onPinBackspace();
                break;
    
            // numeric and numpad
            case 49 :
            case 97 :
                onPinAdd(1);
                break;
            case 50 :
            case 98 :
                onPinAdd(2);
                break;
            case 51 :
            case 99 :
                onPinAdd(3);
                break;
            case 52 :
            case 100 :
                onPinAdd(4);
                break;
            case 53 :
            case 101 :
                onPinAdd(5);
                break;
            case 54 :
            case 102 :
                onPinAdd(6);
                break;
            case 55 :
            case 103 :
                onPinAdd(7);
                break;
            case 56 :
            case 104 :
                onPinAdd(8);
                break;
            case 57 :
            case 105 :
                onPinAdd(9);
                break;
        }
    }

    render(): void {
        const { onPinAdd, onPinBackspace, onPinSubmit } = this.props.modalActions;
        const { pin } = this.props.modal;
        return (
            <div className="pin">
                <h3>Please enter your PIN.</h3>
                <h4>Look at the device for number positions.</h4>
                <div className="pin_row">
                    <button type="button" data-value="7" onClick={ event => onPinAdd(7) }>&#8226;</button>
                    <button type="button" data-value="8" onClick={ event => onPinAdd(8) }>&#8226;</button>
                    <button type="button" data-value="9" onClick={ event => onPinAdd(9) }>&#8226;</button>
                </div>
                <div className="pin_row">
                    <button type="button" data-value="4" onClick={ event => onPinAdd(4) }>&#8226;</button>
                    <button type="button" data-value="5" onClick={ event => onPinAdd(5) }>&#8226;</button>
                    <button type="button" data-value="6" onClick={ event => onPinAdd(6) }>&#8226;</button>
                </div>
                <div className="pin_row">
                    <button type="button" data-value="1" onClick={ event => onPinAdd(1) }>&#8226;</button>
                    <button type="button" data-value="2" onClick={ event => onPinAdd(2) }>&#8226;</button>
                    <button type="button" data-value="3" onClick={ event => onPinAdd(3) }>&#8226;</button>
                </div>
                <div className="pin_input_row">
                    <input type="password" className="input" autoComplete="off" maxLength="9" disabled value={pin} />
                    <button type="button" className="pin_backspace" onClick={ event => onPinBackspace() }>&#9003;</button>
                </div>
                <div><button className="submit" type="button" onClick={ event => onPinSubmit(pin) }>Enter</button></div>
            </div>
        );
    }
}