/* @flo */
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

const getTokenHistory = async (tokenAddress, address) => {

    // 0x58cda554935e4a1f2acbe15f8757400af275e084
    // 0x000000000000000000000000 + 98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad
    let url: string = 'https://ropsten.etherscan.io/api?module=logs&action=getLogs';
        url += '&fromBlock=0&toBlock=latest';
        url += `&address=${tokenAddress}`;
        url += '&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        url += `&topic2=${ address }`;
    // https://api.etherscan.io/api?module=logs&action=getLogs
    // &fromBlock=0
    // &toBlock=latest
    // &address=[Token Contract Address]
    // &topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    // &topic1=[From Address, padded to 32 bytes - optional]
    // &topic2=[To Address, padded to 32 bytes - optional]

    console.log("TOKENURL", url);
    const json = await httpRequest(url);
    return json;
}

export const loadTokenHistory = (address): Promise<any> => {
    // https://ropsten.etherscan.io/apis#logs
    return async (dispatch, getState): Promise<any> => {
        const tkn = '0x58cda554935e4a1f2acbe15f8757400af275e084';
        const ad = '0x00000000000000000000000098ead4bd2fbbb0cf0b49459aa0510ef53faa6cad';
        const incoming = await getTokenHistory(tkn, ad);

        console.log("TOKEN HIST!", JSON.parse(incoming) );
    }
}

export const loadTransactionStatus = (txid): Promise<any> => {
    return async (dispatch, getState): Promise<any> => {
        const json = await getTransactionStatus(txid);
        const status = JSON.parse(json);

        console.error("TXSTAT", status)

        if (status.result.blockHash) {
            // find address with pending tx
            const { addresses } = getState().addresses;
            for (let addr of addresses) {
                if (addr.findPendingTx(txid)) {
                    dispatch( getBalance(addr) );

                    const txType = status.result.from === addr.address ? 'out' : 'in';
                    const txAddress = txType === 'out' ? status.result.to : status.result.from;

                    dispatch({
                        type: ACTIONS.ADDRESS_ADD_TO_HISTORY,
                        address: addr,
                        entry: {
                            txid: status.result.hash,
                            type: txType,
                            timestamp: '0',
                            address: txAddress,
                            value: status.result.value
                        }
                    });

                    //dispatch( loadHistory(addr, 3000) );
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

        /*
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
        */
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
                    //store.dispatch( loadHistory( addresses[addressId] ) );
                    //store.dispatch( loadTokenHistory( addresses[addressId] ) );
                }
                
                //console.error("ETH", parts, "id", parts.length, parts.length === 3 && parts[1] === "address");
            }
        }
    }
};

export default EtherscanService;
