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
    getTransactionInfo(byId: string) {
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
                        const convertedTxObj: Transaction = this.convertRawTransactionToNormal(
                            response
                        );
                        resolve(convertedTxObj);
                    } else {
                        reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                    }
                }
            );
        });
    }

    convertRawTransactionToNormal({ result }: any): Transaction {
        try {
            if (result.vin[0].vout) {
                const senderObj = result.vout.find(({ n }) => result.vin[0].vout === n);
                const sender = senderObj.scriptPubKey.addresses[0];

                result.vin.forEach(oneVin => {
                    oneVin.addresses = [sender];
                });
            }

            const vin: [VinVout] = result.vin.map((oneVin, index) => {
                const returnObj: any = {};
                returnObj.n = index;

                if (oneVin.coinbase) {
                    returnObj.coinbase = oneVin.coinbase;
                    returnObj.isAddress = false;
                } else {
                    returnObj.addresses = oneVin.addresses;
                    returnObj.isAddress = true;
                }

                if (oneVin.sequence) {
                    returnObj.sequence = oneVin.sequence;
                }
                


                return {
                    n: index,
                    addresses: oneVin.addresses ? oneVin.addresses : [],
                    isAddress: !oneVin.coinbase, // if coinbase -> it is mined transaction, no address
                }
            });

            // return {
            //     txid: result.txid,
            //     version: result.version,
            //     vin: 
            // };
            return result;
        } catch (e) {
            throw new Error("Can 't find the transaction, do you have the txindex=1 enabled ?");
        }
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
