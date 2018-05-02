/* @flow */
'use strict';

import React, { Component } from 'react';
import Loader from '../common/LoaderCircle';

import type { Props } from './index';

type State = {
    countdown: number;
    ticker?: number;
}

export default class RememberDevice extends Component<Props, State> {

    state: State;

    constructor(props: Props) {
        super(props);

        this.state = {
            countdown: 10,
        }
        // this.setState({
        //     countdown: 10
        // });
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
                    countdown: this.state.countdown - 1
                });
            }
        }

        this.setState({
            countdown: 10,
            ticker: window.setInterval(ticker, 1000)
        });



        //this.keyboardHandler = this.keyboardHandler.bind(this);
        //window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        //window.removeEventListener('keydown', this.keyboardHandler, false);
        if (this.state.ticker) {
            window.clearInterval(this.state.ticker);
        }
    }

    render(): any {
        if (!this.props.modal.opened) return null;
        const { device, instances } = this.props.modal;
        const { onForgetDevice, onRememberDevice } = this.props.modalActions;

        let label = device.label;
        let devicePlural = false;
        if (instances && instances.length > 0) {
            label = instances.map(i => {
                return (<span>{i.instanceLabel}</span>);
            })
            devicePlural = instances.length > 1;
        }
        return (
            <div className="remember">
                <h3>Forget {label}?</h3>
                <p>Would you like TREZOR Wallet to forget your device or to remember it, so that it is still visible even while disconnected?</p>
                <button onClick={ event => onForgetDevice(device) }>Forget</button>
                <button className="white" onClick={ event => onRememberDevice(device) }><span>Remember <Loader size="28" label={  this.state.countdown.toString() } /></span></button>
            </div>
        );
    }
}

export const ForgetDevice = (props: any): any => {
    const { device } = props.modal;
    const { onForgetSingleDevice, onCancel } = props.modalActions;
    return (
        <div className="remember">
            <h3>Forget { device.instanceLabel } ?</h3>
            <p>Forgetting only removes the device from the list on the left, your bitcoins are still safe and you can access them by reconnecting your TREZOR again.</p>
            <button onClick={ event => onForgetSingleDevice(device) }>Forget</button>
            <button className="white" onClick={ onCancel }>Don't forget</button>
        </div>
    );
}

export const DisconnectDevice = (props: any): any => {
    const { device } = props.modal;
    const { onForgetSingleDevice, onCancel } = props.modalActions;
    return (
        <div className="remember">
            <h3>Unplug { device.instanceLabel }</h3>
            <p>TREZOR Wallet will forget your TREZOR right after you disconnect it.</p>
            <b>TODO: its not true, actually i've already forget those data!!!</b>
        </div>
    );
}