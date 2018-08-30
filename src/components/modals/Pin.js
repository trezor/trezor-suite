/* @flow */


import React, { Component } from 'react';

import type { Props } from './index';

type State = {
    pin: string;
}

export default class Pin extends Component<Props, State> {
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    constructor(props: Props) {
        super(props);

        this.state = {
            pin: '',
        };
    }

    onPinAdd = (input: number): void => {
        let pin: string = this.state.pin;
        if (pin.length < 9) {
            pin += input;
            this.setState({
                pin,
            });
        }
    }

    onPinBackspace = (): void => {
        this.setState({
            pin: this.state.pin.substring(0, this.state.pin.length - 1),
        });
    }

    keyboardHandler(event: KeyboardEvent): void {
        const { onPinSubmit } = this.props.modalActions;
        const { pin } = this.state;

        event.preventDefault();
        switch (event.keyCode) {
            case 13:
                // enter,
                onPinSubmit(pin);
                break;
            // backspace
            case 8:
                this.onPinBackspace();
                break;

            // numeric and numpad
            case 49:
            case 97:
                this.onPinAdd(1);
                break;
            case 50:
            case 98:
                this.onPinAdd(2);
                break;
            case 51:
            case 99:
                this.onPinAdd(3);
                break;
            case 52:
            case 100:
                this.onPinAdd(4);
                break;
            case 53:
            case 101:
                this.onPinAdd(5);
                break;
            case 54:
            case 102:
                this.onPinAdd(6);
                break;
            case 55:
            case 103:
                this.onPinAdd(7);
                break;
            case 56:
            case 104:
                this.onPinAdd(8);
                break;
            case 57:
            case 105:
                this.onPinAdd(9);
                break;
        }
    }


    componentWillMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    render() {
        if (!this.props.modal.opened) return null;

        const { onPinSubmit } = this.props.modalActions;
        const { device } = this.props.modal;
        const { pin } = this.state;

        return (
            <div className="pin">
                {/* <button className="close-modal transparent"></button> */}
                <h3>Enter { device.label } PIN</h3>
                <p>The PIN layout is displayed on your TREZOR.</p>

                <div className="pin-input-row">
                    <input type="password" autoComplete="off" maxLength="9" disabled value={pin} />
                    <button type="button" className="pin-backspace transparent" onClick={event => this.onPinBackspace()} />
                </div>

                <div className="pin-row">
                    <button type="button" data-value="7" onClick={event => this.onPinAdd(7)}>&#8226;</button>
                    <button type="button" data-value="8" onClick={event => this.onPinAdd(8)}>&#8226;</button>
                    <button type="button" data-value="9" onClick={event => this.onPinAdd(9)}>&#8226;</button>
                </div>
                <div className="pin-row">
                    <button type="button" data-value="4" onClick={event => this.onPinAdd(4)}>&#8226;</button>
                    <button type="button" data-value="5" onClick={event => this.onPinAdd(5)}>&#8226;</button>
                    <button type="button" data-value="6" onClick={event => this.onPinAdd(6)}>&#8226;</button>
                </div>
                <div className="pin-row">
                    <button type="button" data-value="1" onClick={event => this.onPinAdd(1)}>&#8226;</button>
                    <button type="button" data-value="2" onClick={event => this.onPinAdd(2)}>&#8226;</button>
                    <button type="button" data-value="3" onClick={event => this.onPinAdd(3)}>&#8226;</button>
                </div>

                <div><button className="submit" type="button" onClick={event => onPinSubmit(pin)}>Enter PIN</button></div>
                <p>Not sure how PIN works? <a className="green" href="http://doc.satoshilabs.com/trezor-user/enteringyourpin.html" target="_blank" rel="noreferrer noopener">Learn more</a></p>
            </div>
        );
    }
}