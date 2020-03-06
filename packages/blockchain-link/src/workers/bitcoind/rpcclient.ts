import RpcBitcoinClient from 'node-bitcoin-rpc';
import { EventEmitter } from 'events';
import { CustomError } from '../../constants/errors';
import { create as createDeferred, Deferred } from '../../utils/deferred';
import {
    AccountInfoParams,
    EstimateFeeParams,
    BlockNotification,
    AddressNotification,
    Send,
    Transaction,
} from '../../types/rpcbitcoind';

import { VinVout } from '../../types/blockbook';
import BigNumber from 'bignumber.js';

export interface LoginData {
    username: string;
    password: string;
    host: string;
    port: string;
}

export class RpcClient {
    loginData: LoginData;

    constructor(loginData: LoginData) {
        this.loginData = loginData;
        RpcBitcoinClient.init(
            loginData.host,
            loginData.port,
            loginData.username,
            loginData.password,
            100
        );
    }

    getBlockchainInfo() {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getblockchaininfo', [], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error); // error in case calling RPC
                    console.log('error:', error);
                } else if (response.error) {
                    reject(new Error(response.error.message)); // possible error from blockchain
                } else if (response.result) {
                    resolve(response.result);
                } else {
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }

    getNetworkInfo() {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getnetworkinfo', [], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error); // error in case calling RPC
                } else if (response.error) {
                    reject(new Error(response.error.message)); // possible error from blockchain
                } else if (response.result) {
                    resolve(response.result);
                } else {
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }
    // getrawtransaction
    getRawTransactionInfo(byId: string) {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call(
                'getrawtransaction',
                [byId, 1],
                (error: string, response: any): void => {
                    if (error) {
                        reject(error); // error in case calling RPC
                    } else if (response.error) {
                        reject(new Error(response.error.message)); // possible error from blockchain
                    } else if (response.result) {
                        resolve(response.result);
                    } else {
                        reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                    }
                }
            );
        });
    }

    async convertRawTransactionToNormal(rawTxData: any): Promise<any> {
        // get total amount in transaction with miner fee
        let totalTransactionWithFee: BigNumber = new BigNumber(0, 8);
        let fee: BigNumber = new BigNumber(0, 8);

        if (
            rawTxData.vin &&
            Array.isArray(rawTxData.vin) &&
            rawTxData.vin[0].txid &&
            rawTxData.vin[0].vout
        ) {
            const senderObj = rawTxData.vout.find(({ n }) => rawTxData.vin[0].vout === n);
            const [sender] = senderObj.scriptPubKey.addresses;

            rawTxData.vin.forEach(oneVin => {
                oneVin.addresses = [sender];
            });

            const inputTxs: any = [];

            await Promise.all(
                rawTxData.vin.map(async oneInput => {
                    const oneTx = await this.getRawTransactionInfo(oneInput.txid);
                    inputTxs.push(oneTx);
                })
            );

            inputTxs.forEach(inputTx => {
                if (inputTx.vout && Array.isArray(inputTx.vout)) {
                    inputTx.vout.forEach(oneOut => {
                        if (
                            oneOut.scriptPubKey &&
                            oneOut.scriptPubKey.addresses &&
                            Array.isArray(oneOut.scriptPubKey.addresses) &&
                            oneOut.scriptPubKey.addresses[0] &&
                            oneOut.scriptPubKey.addresses[0].toLowerCase() === sender.toLowerCase()
                        ) {
                            totalTransactionWithFee = totalTransactionWithFee.plus(oneOut.value);
                        }
                    });
                }
            });

            // get miner fee
            // fee
            if (rawTxData.vout && Array.isArray(rawTxData.vout)) {
                let summOfVout: BigNumber = new BigNumber(0, 8);
                rawTxData.vout.forEach(oneOutTx => {
                    summOfVout = summOfVout.plus(oneOutTx.value);
                });

                fee = totalTransactionWithFee.minus(summOfVout);
            }
            console.log(
                'final transaction: ',
                totalTransactionWithFee.toFixed(8),
                'total fee: ',
                fee.toFixed(8)
            );
            console.log('totalTransactionWithFee', totalTransactionWithFee.toFixed(8));
        }
        return rawTxData;
    }
    // getBlockchainInfo(): Promise {
    //     console.log('before'); // getnetworkinfo getwalletinfo
    //     RpcBitcoinClient.call('getrpcinfo', [], function callback(
    //         error: string,
    //         response: any
    //     ): void {
    //         if (error) {
    //             console.log('some error', error);
    //         } else {
    //             console.log('response:', response);
    //         }
    //     });
    // }
    // setConnectionTimeout() {
    //     this.clearConnectionTimeout();
    //     this.connectionTimeout = setTimeout(
    //         this.onTimeout.bind(this),
    //         this.options.timeout || DEFAULT_TIMEOUT
    //     );
    // }

    // clearConnectionTimeout() {
    //     if (this.connectionTimeout) {
    //         clearTimeout(this.connectionTimeout);
    //         this.connectionTimeout = undefined;
    //     }
    // }

    // dispose() {
    //     if (this.pingTimeout) {
    //         clearTimeout(this.pingTimeout);
    //     }
    //     if (this.connectionTimeout) {
    //         clearTimeout(this.connectionTimeout);
    //     }

    //     const { ws } = this;
    //     if (this.isConnected()) {
    //         this.disconnect();
    //     }
    //     if (ws) {
    //         ws.removeAllListeners();
    //     }

    //     this.removeAllListeners();
    // }
}
