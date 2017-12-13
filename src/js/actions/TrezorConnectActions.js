/* @flow */
'use strict';

import TrezorConnect, { UI } from 'trezor-connect';
import * as ACTIONS from './index';

//import wallet from 'ethereumjs-wallet';
//import hdkey from 'ethereumjs-wallet/hdkey';
import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';

import { Address } from '../reducers/AddressesReducer';
import { getBalance } from '../services/Web3Service';
import { getTransactionHistory } from '../services/EtherscanService';

import { push } from 'react-router-redux';

export function onSelectDevice2(path: string): any {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path
    }
}

export function remove(devicePath): any {
    return async (dispatch, getState) => {

        const { addresses } = getState().addresses;
        const availableAddresses = addresses.filter(a => a.devicePath !== devicePath);

        dispatch({
            type: ACTIONS.ADDRESS_DELETE,
            addresses: availableAddresses
        })
    }
}

export function discover(devicePath): any {
    return async (dispatch, getState) => {

        const { web3 } = getState().web3;

        const response = await TrezorConnect.getPublicKey({ path: "m/44'/60'/0'/0", confirmation: false });
        const basePath: Array<number> = response.data.path;
        const hdKey = new HDKey();
        hdKey.publicKey = new Buffer(response.data.publicKey, 'hex');
        hdKey.chainCode = new Buffer(response.data.chainCode, 'hex');

        const loop = async (index: number) => {
            const derivedKey = hdKey.derive(`m/${index}`);
            const path = basePath.concat(index);
            const ethAddress: string = '0x' + EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
            const address = new Address(devicePath, index, path, ethAddress);

            dispatch({
                type: ACTIONS.ADDRESS_CREATE,
                devicePath,
                address
            })

            const balance = await getBalance(ethAddress);

            dispatch({
                type: ACTIONS.ADDRESS_SET_BALANCE,
                address,
                balance: web3.fromWei(balance.toString(), 'ether')
            })

            // const history = await getTransactionHistory(ethAddress);
            // dispatch({
            //     type: ACTIONS.ADDRESS_SET_HISTORY,
            //     address,
            //     history
            // })

            // TODO redirect to 1st account
            if (index === 0) {
                dispatch( push('/address/0') );
            }

            if (index < 2) {
                loop( index + 1);
            }
        }

        loop(0);
    }
}

export function onSelectDevice(): any {
    return async (dispatch, getState) => {
        // dispatch(Web3Actions.composeTransaction());
    }
}
