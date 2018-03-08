/* @flow */
'use strict';

import React from 'react';
import { findSelectedDevice } from '../../reducers/TrezorConnectReducer';

const ConfirmAddress = (props: any): any => {
    
    const account = props.accounts.find(a => a.checksum === props.receive.checksum && a.index === props.receive.accountIndex && a.coin === props.receive.coin);
    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === account.coin);

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

    const account = props.accounts.find(a => a.checksum === props.receive.checksum && a.index === props.receive.accountIndex && a.coin === props.receive.coin);

    const {
        onCancel 
    } = props.modalActions;

    const { 
        showUnverifiedAddress,
        showAddress
    } = props.receiveActions;


    return (
        <div className="confirm-address-unverified">
            <button className="close-modal transparent" onClick={ onCancel }></button>
            <h3>Your TREZOR is not connected</h3>
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
}
