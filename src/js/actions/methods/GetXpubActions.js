/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';


export const COIN_CHANGE: string = 'action__getxpub_coin_change';
export const RESPONSE_TAB_CHANGE: string = 'action__getxpub_response_tab_change';
export const GETXPUB_RESPONSE: string = 'action__getxpub_response';
export const TYPE_CHANGE: string = 'action__getxpub_type_change';
export const PATH_CHANGE: string = 'action__getxpub_path_change';
export const ACCOUNT_CHANGE: string = 'action__getxpub_account_change';
export const ACCOUNT_TYPE_CHANGE: string = 'action__getxpub_account_type_change';
export const CONFIRMATION_CHANGE: string = 'action__getxpub_confirmation_change';


export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onTypeChange(type: string): any {
    return {
        type: TYPE_CHANGE,
        getxpubType: type
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onAccountChange(id: string): any {
    return {
        type: ACCOUNT_CHANGE,
        accountID: parseInt(id)
    }
}

export function onAccountTypeChange(status: boolean): any {
    return {
        type: ACCOUNT_TYPE_CHANGE,
        accountLegacy: status
    }
}

export function onConfirmationChange(status: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        confirmation: status
    }
}

export function onResponseTabChange(tab: string): any {
    return {
        type: RESPONSE_TAB_CHANGE,
        tab
    }
}

export function onGetXpub(params: any): any {
    return async function (dispatch, getState) {

        
                // var TREZOR_DESCS = [
                //     // TREZOR v1
                //     { vendorId: 0x534c, productId: 0x0001 },
                //     // TREZOR v2 Bootloader
                //     { vendorId: 0x1209, productId: 0x53c0 },
                //     // TREZOR v2 Firmware
                //     { vendorId: 0x1209, productId: 0x53c1 },
                // ];
        
                // var usb = navigator.usb;
                // try {
                //     usb.requestDevice({filters: TREZOR_DESCS}).then(function(r){
                //         console.log("REQ", r);
                //     });
        
                //     //const devices = await usb.getDevices();
                //     //postMessage(new UiMessage('WEBUSB'));
                // } catch (error) {
                //     //postMessage(new UiMessage('WEBUSB-ERROR'));
                //     console.log("ERROR")
                // }
                // const response = 'A';
      
        const response = await TrezorConnect.getPublicKey({
            //...params,
            path: "m/46'/60'/0'",
            confirmation: false,
            transformFormat: true,
            useEmptyPassphrase: true,
        });

        // const response = await TrezorConnect.requestDevice();


        // const response = await TrezorConnect.cipherKeyValue({
        //     path: "m/10016'/0",
        //     key: "Activate TREZOR Password Manager?",
        //     value: "2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee",
        //     encrypt: true,
        //     askOnEncrypt: true,
        //     askOnDecrypt: true,
        //     useEmptyPassphrase: true,
        //     override: true
        // });

        // const response = await TrezorConnect.ethereumGetAddress({
        //     path: [],
        //     // showOnTrezor: false,
        //     useEmptyPassphrase: true
        // });

        // const response = await TrezorConnect.ethereumSignTransaction({
        //     path: "m/44'/60'/0'/0",
        //     nonce: "00",
        //     gasPrice: '098bca5a00',
        //     gasLimit: 'a43f',
        //     to: 'e0b7927c4af23765cb51314a0e0521a9645f0e2a',
        //     value: '010000000000000000',
        //     chainId: 1
        // });

        // const response = await TrezorConnect.ethereumSignMessage({
        //     path: "m/44'/60'/0'/0",
        //     message: "Example message"
        // });

        // const response = await TrezorConnect.ethereumVerifyMessage({
        //     address: "4c1686daf17e1b534def7dccd829a5163f72264c",
        //     message: "Example message",
        //     signature: "b885ec7f8ccc19d3d6ec0e145691c906420a6991f393ef77a841cc0702e5ad101d8308ef8058bcb1f29bb30ad6b8afc87f64a577bab06136fc6a3d9bf30703831b"
        // });

        // const response = await TrezorConnect.getFeatures({
        //     useEmptyPassphrase: true
        // });

        dispatch({
            type: GETXPUB_RESPONSE,
            response
        });
    }
}