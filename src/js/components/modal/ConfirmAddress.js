/* @flow */
'use strict';

import React from 'react';
import { findSelectedDevice } from '../../reducers/TrezorConnectReducer';

const ConfirmAddress = (props: any): any => {
    
    const account = props.accounts.find(a => a.deviceState === props.receive.deviceState && a.index === props.receive.accountIndex && a.network === props.receive.network);
    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === account.network);

    return (
        <div className="confirm-address">
            <div className="header">
                <h3>Confirm address on TREZOR</h3>
                <p>Please compare your address on device with address shown bellow.</p>
            </div>
            <div className="content">
                <p>{ account.address }</p>
                <label>{ selectedCoin.symbol } account #{ (account.index + 1) }</label>
            </div>
        </div>
    );
}
export default ConfirmAddress;

export const ConfirmUnverifiedAddress = (props: any): any => {

    const account = props.accounts.find(a => a.deviceState === props.receive.deviceState && a.index === props.receive.accountIndex && a.network === props.receive.network);

    const {
        onCancel 
    } = props.modalActions;

    const { 
        showUnverifiedAddress,
        showAddress
    } = props.receiveActions;

    const {
        device
    } = props.modal;

    if (!device.connected) {
        return (
            <div className="confirm-address-unverified">
                <button className="close-modal transparent" onClick={ onCancel }></button>
                <h3>{ device.instanceLabel } is not connected</h3>
                <p>To prevent phishing attacks, you should verify the address on your TREZOR first. Please reconnect your device to continue with the verification process.</p>
                <button onClick={ event => {
                    onCancel();
                    showAddress(account.addressPath);
                } }>Try again</button>
                <button className="white" onClick={ event => {
                    onCancel();
                    showUnverifiedAddress();
                } }>Show unverified address</button>
            </div>
        );
    } else {
        const enable: string = device.features.passphrase_protection ? 'Enable' : 'Disable';
        return (
            <div className="confirm-address-unverified">
                <button className="close-modal transparent" onClick={ onCancel }></button>
                <h3>{ device.instanceLabel } is unavailable</h3>
                <p>To prevent phishing attacks, you should verify the address on your TREZOR first. { enable } passphrase settings to continue with the verification process.</p>
                <button onClick={ event => {
                    onCancel();
                    showAddress(account.addressPath);
                } }>Try again</button>
                <button className="white" onClick={ event => {
                    onCancel();
                    showUnverifiedAddress();
                } }>Show unverified address</button>
            </div>
        );
    }
}
