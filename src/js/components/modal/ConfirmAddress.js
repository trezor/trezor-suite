/* @flow */
'use strict';

import React from 'react';
import { findAccount } from '../../reducers/AccountsReducer';
import { findSelectedDevice } from '../../reducers/TrezorConnectReducer';

import type { Props } from './index';

const ConfirmAddress = (props: Props) => {

    const { accounts, abstractAccount } = props;
    const account = findAccount(accounts, abstractAccount.index, abstractAccount.deviceState, abstractAccount.network);
    if (!account) return null;

    return (
        <div className="confirm-address">
            <div className="header">
                <h3>Confirm address on TREZOR</h3>
                <p>Please compare your address on device with address shown bellow.</p>
            </div>
            <div className="content">
                <p>{ account.address }</p>
                <label>{ abstractAccount.coin.symbol } account #{ (account.index + 1) }</label>
            </div>
        </div>
    );
}
export default ConfirmAddress;

export const ConfirmUnverifiedAddress = (props: Props): any => {

    if (!props.modal.opened) return null;
    const {
        device
    } = props.modal;

    const { accounts, abstractAccount } = props;

    const {
        onCancel 
    } = props.modalActions;

    const { 
        showUnverifiedAddress,
        showAddress
    } = props.receiveActions;

    const account = findAccount(accounts, abstractAccount.index, abstractAccount.deviceState, abstractAccount.network);
    if (!account) return null;
    
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
        // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
        const enable: string = device.features && device.features.passphrase_protection ? 'Enable' : 'Disable';
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
