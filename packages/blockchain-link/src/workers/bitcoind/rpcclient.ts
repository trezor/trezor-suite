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

    getBlockInfo(byHash: string) {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getblock', [byHash], (error: string, response: any): void => {
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

    async convertRawTransactionToNormal(rawTxData: any): Promise<Transaction> {
        const blockData = await this.getBlockInfo(rawTxData.blockhash);

        // check if this is a mining transaction
        const possibleCoinbaseTrans = this.processIfMinerTransaction(rawTxData, blockData);
        if (possibleCoinbaseTrans !== false) {
            return possibleCoinbaseTrans as Transaction;
        }

        // if no mining transaction -> continue
        if (
            rawTxData.vin &&
            Array.isArray(rawTxData.vin) &&
            rawTxData.vin[0].txid &&
            rawTxData.vin[0].vout
        ) {
            // get input tx's
            const inputTxs: any = [];
            await Promise.all(
                rawTxData.vin.map(async oneInput => {
                    const oneTx = await this.getRawTransactionInfo(oneInput.txid);
                    inputTxs.push(oneTx);
                })
            );

            // detecting the sender
            const senderObj = rawTxData.vout.find(({ n }) => rawTxData.vin[0].vout === n);
            const [sender] = senderObj.scriptPubKey.addresses;

            // transform vin
            const vins: VinVout[] = rawTxData.vin.map((oneVin, index) => {
                const vinReturnObj: VinVout = {
                    txid: oneVin.txid,
                    vout: oneVin.vout,
                    sequence: oneVin.sequence,
                    n: index,
                    addresses: [sender],
                    isAddress: !!sender,
                    hex: oneVin.scriptSig.hex,
                };

                inputTxs.forEach(oneTx => {
                    if (oneTx.txid.toLowerCase() === oneVin.txid.toLowerCase()) {
                        oneTx.vout.forEach(innerVout => {
                            if (
                                sender &&
                                typeof sender !== 'undefined' &&
                                innerVout.scriptPubKey &&
                                innerVout.scriptPubKey.addresses &&
                                Array.isArray(innerVout.scriptPubKey.addresses) &&
                                innerVout.scriptPubKey.addresses.includes(sender)
                            ) {
                                vinReturnObj.value = new BigNumber(innerVout.value)
                                    .multipliedBy(100000000)
                                    .toFixed();
                            }
                        });
                    }
                });
                return vinReturnObj;
            });

            // transform vout
            const vouts: VinVout[] = rawTxData.vout.map((oneVout, index) => {
                const retObj: VinVout = {
                    value: new BigNumber(oneVout.value).times(100000000).toFixed(),
                    n: index,
                    hex: oneVout.scriptPubKey.hex,
                    isAddress: !!oneVout.scriptPubKey.addresses,
                };
                if (oneVout.scriptPubKey.addresses) {
                    retObj.addresses = oneVout.scriptPubKey.addresses;
                }
                return retObj;
            });

            // get total tx amounts
            const totalAmounts = this.getTxTotalAmountAndFee(inputTxs, rawTxData, sender);

            const transObj: Transaction = {
                txid: rawTxData.txid,
                version: rawTxData.version,
                vin: vins,
                vout: vouts,
                blockHash: rawTxData.blockhash,
                blockHeight: blockData.height,
                confirmations: rawTxData.confirmations,
                blockTime: rawTxData.blocktime,
                value: totalAmounts.totalTransactionIn
                    .minus(totalAmounts.fee)
                    .multipliedBy(100000000)
                    .toFixed(),
                valueIn: totalAmounts.totalTransactionIn.multipliedBy(100000000).toFixed(),
                fees: totalAmounts.fee.multipliedBy(100000000).toFixed(),
                hex: rawTxData.hex,
            };
            return transObj;
        }
        throw new Error('Error at the stage of forming a data transaction from RPC.');
    }

    processIfMinerTransaction(rawTxData: any, blockData: any): boolean | Transaction {
        if (
            rawTxData.vin &&
            Array.isArray(rawTxData.vin) &&
            rawTxData.vin.length > 0 &&
            rawTxData.vin[0].coinbase
        ) {
            const vins: VinVout[] = rawTxData.vin.map((oneVin, index) => {
                return {
                    sequence: oneVin.sequence,
                    n: index,
                    isAddress: false,
                    coinbase: oneVin.coinbase,
                };
            });

            let valueTotal = new BigNumber(0, 8);
            const vouts: VinVout[] = rawTxData.vout.map((oneVout, index) => {
                if (oneVout.value) {
                    valueTotal = valueTotal.plus(new BigNumber(oneVout.value).times(100000000));
                }
                const retObj: VinVout = {
                    value: new BigNumber(oneVout.value).times(100000000).toFixed(),
                    n: index,
                    hex: oneVout.scriptPubKey.hex,
                    isAddress: !!oneVout.scriptPubKey.addresses,
                    sequence: oneVout.sequence,
                    coinbase: oneVout.coinbase,
                };
                if (oneVout.scriptPubKey.addresses) {
                    retObj.addresses = oneVout.scriptPubKey.addresses;
                }
                return retObj;
            });

            const returnObj: Transaction = {
                txid: rawTxData.txid,
                version: rawTxData.version,
                vin: vins,
                vout: vouts,
                blockHash: rawTxData.blockhash,
                blockHeight: blockData.height,
                confirmations: rawTxData.confirmations,
                blockTime: rawTxData.blocktime,
                value: valueTotal.toFixed(),
                valueIn: '0',
                fees: '0',
                hex: rawTxData.hex,
            };

            return returnObj;
        }
        return false;
    }

    getTxTotalAmountAndFee(
        fromInputsTransactions: Array<any>,
        rawTxData: any,
        sender: string
    ): { totalTransactionIn: BigNumber; fee: BigNumber } {
        let totalTransactionIn: BigNumber = new BigNumber(0, 8);
        let fee: BigNumber = new BigNumber(0, 8);

        fromInputsTransactions.forEach(inputTx => {
            if (inputTx.vout && Array.isArray(inputTx.vout)) {
                inputTx.vout.forEach(oneOut => {
                    if (
                        oneOut.scriptPubKey &&
                        oneOut.scriptPubKey.addresses &&
                        Array.isArray(oneOut.scriptPubKey.addresses) &&
                        oneOut.scriptPubKey.addresses[0] &&
                        oneOut.scriptPubKey.addresses[0].toLowerCase() === sender.toLowerCase()
                    ) {
                        totalTransactionIn = totalTransactionIn.plus(oneOut.value);
                    }
                });
            }
        });

        // get miner fee
        if (rawTxData.vout && Array.isArray(rawTxData.vout)) {
            let summOfVout: BigNumber = new BigNumber(0, 8);
            rawTxData.vout.forEach(oneOutTx => {
                summOfVout = summOfVout.plus(oneOutTx.value);
            });

            fee = totalTransactionIn.minus(summOfVout);
        }

        if (totalTransactionIn.eq(new BigNumber(0)) === true || fee.eq(new BigNumber(0)) === true) {
            throw new Error(
                'The amount in the transaction or Commission is zero. There may be an error in the calculations or changes in the bitcoind API.'
            );
        }

        return { totalTransactionIn, fee };
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
