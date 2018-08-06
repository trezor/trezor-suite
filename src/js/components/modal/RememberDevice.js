/* @flow */


import React, { Component } from 'react';
import Loader from '../common/LoaderCircle';

import type { Props } from './index';

type State = {
    countdown: number;
    ticker?: number;
}

export default class RememberDevice extends Component<Props, State> {
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    constructor(props: Props) {
        super(props);

        this.state = {
            countdown: 10,
        };
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    componentDidMount(): void {
        const ticker = () => {
            if (this.state.countdown - 1 <= 0) {
                // TODO: possible race condition,
                // device could be already connected but it didn't emit Device.CONNECT event yet
                window.clearInterval(this.state.ticker);
                if (this.props.modal.opened) {
                    this.props.modalActions.onForgetDevice(this.props.modal.device);
                }
            } else {
                this.setState({
                    countdown: this.state.countdown - 1,
                });
            }
        };

        this.setState({
            countdown: 10,
            ticker: window.setInterval(ticker, 1000),
        });

        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        if (this.state.ticker) {
            window.clearInterval(this.state.ticker);
        }
    }

    forget() {
        if (this.props.modal.opened) {
            this.props.modalActions.onForgetDevice(this.props.modal.device);
        }
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device, instances } = this.props.modal;
        const { onForgetDevice, onRememberDevice } = this.props.modalActions;

        let label = device.label;
        const devicePlural: string = instances && instances.length > 1 ? 'devices or to remember them' : 'device or to remember it';
        if (instances && instances.length > 0) {
            label = instances.map((instance, index) => {
                let comma: string = '';
                if (index > 0) comma = ', ';
                return (
                    <span key={index}>{ comma }{ instance.instanceLabel }</span>
                );
            });
        }
        return (
            <div className="remember">
                <h3>Forget {label}?</h3>
                <p>Would you like TREZOR Wallet to forget your { devicePlural }, so that it is still visible even while disconnected?</p>
                <button onClick={event => this.forget()}><span>Forget <Loader size="28" label={this.state.countdown.toString()} /></span></button>
                <button className="white" onClick={event => onRememberDevice(device)}>Remember</button>
            </div>
        );
    }
}

export class ForgetDevice extends Component<Props> {
    keyboardHandler: (event: KeyboardEvent) => void;

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    componentDidMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    forget() {
        if (this.props.modal.opened) {
            this.props.modalActions.onForgetSingleDevice(this.props.modal.device);
        }
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device } = this.props.modal;
        const { onCancel } = this.props.modalActions;
        return (
            <div className="remember">
                <h3>Forget { device.instanceLabel } ?</h3>
                <p>Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your TREZOR again.</p>
                <button onClick={event => this.forget()}>Forget</button>
                <button className="white" onClick={onCancel}>Don't forget</button>
            </div>
        );
    }
}
