/* @flow */
'use strict';

import React, { Component } from 'react';
import { findAccount } from '~/js/reducers/AccountsReducer';

import type { Props } from './index';

const ConfirmAddress = (props: Props) => {

    const { accounts, selectedAccount } = props;
    if (!selectedAccount) return null;
    const account = findAccount(accounts, selectedAccount.index, selectedAccount.deviceState, selectedAccount.network);
    if (!account) return null;

    return (
        <div className="confirm-address">
            <div className="header">
                <h3>Confirm address on TREZOR</h3>
                <p>Please compare your address on device with address shown bellow.</p>
            </div>
            <div className="content">
                <p>{ account.address }</p>
                <label>{ selectedAccount.coin.symbol } account #{ (account.index + 1) }</label>
            </div>
        </div>
    );
}
export default ConfirmAddress;

export class ConfirmUnverifiedAddress extends Component<Props> {

    keyboardHandler: (event: KeyboardEvent) => void;

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.verifyAddress();
        }
    }

    componentDidMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    verifyAddress() {
        if (!this.props.modal.opened) return;

        const { 
            accounts, 
            selectedAccount 
        } = this.props;

        if(!selectedAccount) return null;
        const account = findAccount(accounts, selectedAccount.index, selectedAccount.deviceState, selectedAccount.network);
        if (!account) return null;

        this.props.modalActions.onCancel();
        this.props.receiveActions.showAddress(account.addressPath);
        
    }

    showUnverifiedAddress() {
        if (!this.props.modal.opened) return;
        
        this.props.modalActions.onCancel();
        this.props.receiveActions.showUnverifiedAddress();
    }

    render() {
        if (!this.props.modal.opened) return null;
        const {
            device
        } = this.props.modal;

        const {
            onCancel 
        } = this.props.modalActions;

        let deviceStatus: string;
        let claim: string;
        
        if (!device.connected) {
            deviceStatus = `${ device.label } is not connected`;
            claim = 'Please connect your device'
        } else {
            // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
            const enable: string = device.features && device.features.passphrase_protection ? 'enable' : 'disable';
            deviceStatus = `${ device.label } is unavailable`;
            claim = `Please ${ enable } passphrase settings`;
        }

        return (
            <div className="confirm-address-unverified">
                <button className="close-modal transparent" onClick={ onCancel }></button>
                <h3>{ deviceStatus }</h3>
                <p>To prevent phishing attacks, you should verify the address on your TREZOR first. { claim } to continue with the verification process.</p>
                <button onClick={ event => this.verifyAddress() }>Try again</button>
                <button className="white" onClick={ event => this.showUnverifiedAddress() }>Show unverified address</button>
            </div>
        );
    }
}
