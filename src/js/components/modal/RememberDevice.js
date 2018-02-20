/* @flow */
'use strict';

import React, { Component } from 'react';
import Loader from '../common/LoaderCircle';

type Props = {
    modal: any;
}

type State = {
    +countdown: number;
    ticker?: number;
}

export default class RememberDevice extends Component {

    state: State;

    constructor(props: any) {
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
                const { device } = this.props.modal;
                this.props.modalActions.onForgetDevice(device);
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
        const { device } = this.props.modal;
        const { onForgetDevice, onRememberDevice } = this.props.modalActions;
        return (
            <div className="remember">
                <h3>Forget { device.label } ?</h3>
                <p>Would you like TREZOR Wallet to forget your device or to remember it, so that it is still visible even while disconnected?</p>
                <button onClick={ event => onForgetDevice(device) }>Forget</button>
                <button className="white" onClick={ event => onRememberDevice(device) }><span>Remember <Loader size={ 28 } label={  this.state.countdown } /></span></button>
            </div>
        );
    }
}

export const ForgetDevice = (props: any): any => {
    const { device } = props.modal;
    const { onForgetSingleDevice, onCancel } = props.modalActions;
    return (
        <div className="remember">
            <h3>Forget { device.label } ?</h3>
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
            <h3>Unplug { device.label }</h3>
            <p>TREZOR Wallet will forget your TREZOR right after you disconnect it.</p>
            <b>TODO: its not true, actually i've already forget those data!!!</b>
        </div>
    );
}