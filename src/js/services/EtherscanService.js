/* @flow */
'use strict';

//http://ropsten.etherscan.io/api?module=account&action=txlist&address=0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad&startblock=0&endblock=99999999&sort=asc&apikey=89IZG471H8ITVXY377I2QWJIT2D62DGG9Z

import { LOCATION_CHANGE, push } from 'react-router-redux';
import { httpRequest } from '../utils/networkUtils';
import * as ACTIONS from '../actions/index';
import { getBalance } from '../actions/Web3Actions';

const API_KEY: string = '89IZG471H8ITVXY377I2QWJIT2D62DGG9Z';
//const API: string = `http://ropsten.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=89IZG471H8ITVXY377I2QWJIT2D62DGG9Z`;
const API: string = `http://ropsten.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`;

export const getTransactionHistory = async (address: string): Promise<Array<any>> => {
    const json = await httpRequest(`${API}&address=${address}`);
    return json;
}

const getTransactionStatus = async (txid: string): Promise<Array<any>> => {
    //https://ropsten.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=0x1e2910a262b1008d0616a0beb24c1a491d78771baa54a33e66065e03b1f46bc1&apikey=YourApiKeyToken
    const url: string = `https://ropsten.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&apikey=${API_KEY}`
    //const url: string = `https://ropsten.etherscan.io/api?module=transaction&action=getstatus&apikey=${API_KEY}`
    const json = await httpRequest(`${url}&txhash=${txid}`);
    return json;
}

export const loadTransactionStatus = (txid): Promise<BigNumber> => {
    return async (dispatch, getState) => {
        const json = await getTransactionStatus(txid);
        const status = JSON.parse(json);

        console.error("TXSTAT", status)

        if (status.result.blockHash) {
            // find address with pending tx
            const { addresses } = getState().addresses;
            for (let addr of addresses) {
                if (addr.findPendingTx(txid)) {
                    dispatch( getBalance(addr) );
                    dispatch( loadHistory(addr, 3000) );
                }
            }

            dispatch({
                type: ACTIONS.TX_STATUS_OK,
                txid
            });

            
        }

        // if (status.status === "1" && status.message === "OK") {
        //     if (status.result.isError === "0") {
        //         dispatch({
        //             type: ACTIONS.TX_STATUS_OK,
        //             txid
        //         });
        //     } else {
        //         dispatch({
        //             type: ACTIONS.TX_STATUS_ERROR,
        //             txid,
        //             error: status.errDescription
        //         });
        //     }
        // } else {
        //     dispatch({
        //         type: ACTIONS.TX_STATUS_UNKNOWN,
        //         txid,
        //         status
        //     });
        // }
    }
}

export const loadHistory = (address, delay): void => {
    return async (dispatch, getState) => {

        // const json = await getTransactionStatus('0x2113e578497f3486944566e2417b5ac3b31d7e76f71557ae0626e2a6fe191e58');
        // console.log("JSON!", json)

        if (delay) {
            console.warn("-----PRELOAD with delay", address)
            await new Promise(resolve => {
                setTimeout(resolve, delay);
            })
        }

        const history = await getTransactionHistory(address.address);
        dispatch({
            type: ACTIONS.ADDRESS_SET_HISTORY,
            address,
            history
        });
    }
}

const EtherscanService = store => next => action => {

    next(action);
    
    if (action.type === LOCATION_CHANGE) {

        const { location } = store.getState().router;
        const { addresses } = store.getState().addresses;

        if (location) {
            const parts = location.pathname.split("/");
            if (parts.length === 3 && parts[1] === "address") {
                const addressId = parseInt(parts[2]);

                if (!isNaN(addressId) && addresses[addressId]) {
                    store.dispatch( loadHistory( addresses[addressId] ) );
                }
                
                //console.error("ETH", parts, "id", parts.length, parts.length === 3 && parts[1] === "address");
            }
        }
    }
};

export default EtherscanService;
