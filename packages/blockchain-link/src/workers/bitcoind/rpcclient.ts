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
    VinVout,
    CalculatedTotal,
} from '../../types/rpcbitcoind';
import {
    HDNode as BitcoinJsHDNode,
    networks as BitcoinJsNetwork,
    address as BitcoinJsAddress,
} from '@trezor/utxo-lib';
import BigNumber from 'bignumber.js';
import GCSFilter from 'golomb';
import Base58check from 'base58check';

// const SEGWIT_INPUT_SCRIPT_LENGTH = 51; // actually 50.25, but let's make extra room
// const INPUT_SCRIPT_LENGTH = 109;
// const P2PKH_OUTPUT_SCRIPT_LENGTH = 25;
// const P2SH_OUTPUT_SCRIPT_LENGTH = 23;
// const P2WPKH_OUTPUT_SCRIPT_LENGTH = 22;
// const P2WSH_OUTPUT_SCRIPT_LENGTH = 34;

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

    deriveXpub = (xpub: string, network: BitcoinJsNetwork, index: number): string => {
        return BitcoinJsHDNode.fromBase58(xpub, network, true)
            .derive(index)
            .getAddress();
    };

    isBech32(address: string): boolean {
        try {
            BitcoinJsAddress.fromBech32(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    async searchAddressInBlock(address: string, blockHash: string): Promise<AddressNotification[]> {
        const decodedAddrObj = Base58check.decode(address, 'hex'); // TODO: find this method in utxo trezor lib
        const hexPubKey = `76a914${decodedAddrObj.data}88ac`; // TODO: find method for various adressess in uxo trezor lib

        const filterInitial = await this.getBlockFilter(blockHash);
        const block_filter = Buffer.from(filterInitial.filter, 'hex');
        const P = 19;
        const filter = GCSFilter.fromNBytes(P, block_filter);
        const block_hash = Buffer.from(blockHash, 'hex');
        const key = block_hash.reverse().slice(0, 16);

        const search = Buffer.from(hexPubKey, 'hex');

        let foundedTxs: any[] = [];
        if (filter.match(key, search) === true) {
            const totalTxs = await this.getBlockTxs(blockHash);
            foundedTxs = await this.iterateTxsInBlock(address, blockHash);
        }
        return foundedTxs;
    }

    async iterateTxsInBlock(
        searchedAddr: string,
        blockhash: string
    ): Promise<AddressNotification[]> {
        const allTxs = await this.getBlockTxs(blockhash);
        const returnTxs: AddressNotification[] = [];
        await Promise.all(
            allTxs.map(async oneTxId => {
                const oneTxObj = await this.getRawTransactionInfo(oneTxId, blockhash);

                if (oneTxObj.vout && Array.isArray(oneTxObj.vout)) {
                    oneTxObj.vout.forEach(async oneVout => {
                        if (
                            oneVout.scriptPubKey &&
                            oneVout.scriptPubKey.addresses &&
                            this.checkAddressInArr(oneVout.scriptPubKey.addresses, searchedAddr) ===
                                true
                        ) {
                            const tx = await this.convertRawTransactionToNormal(oneTxObj);
                            const notif: AddressNotification = {
                                address: searchedAddr,
                                tx,
                            };
                            returnTxs.push(notif);
                        }
                    });
                }
            })
        );

        return returnTxs;
    }

    checkAddressInArr(arrAddr, neededAddr) {
        return arrAddr.some(oneAddr => {
            return neededAddr === oneAddr;
        });
    }

    getAccountinfo(payload: AccountInfoParams): object {
        if (payload.details && payload.details === 'tokens') {
            const returnObj = {
                address: payload.descriptor,
                balance: '0',
                totalReceived: '0',
                totalSent: '0',
                unconfirmedBalance: '0',
                unconfirmedTxs: 0,
                txs: 0,
                usedTokens: 20,
                // eslint-disable-next-line @typescript-eslint/no-array-constructor
                tokens: Array(),
            };

            for (let i = 0; i <= 20; i++) {
                returnObj.tokens.push({
                    type: 'XPUBAddress',
                    name: this.deriveXpub(payload.descriptor, BitcoinJsNetwork.testnet, i),
                    path: `m/44'/1'/0'/0/${i}`,
                    transfers: 0,
                    decimals: 8,
                });
            }
            return returnObj;
        }
        return {};
    }
    getBlockchainInfo(onlyLastBlockInfo = false) {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getblockchaininfo', [], function callback(
                error: string,
                response: any | BlockNotification
            ): void {
                if (error) {
                    reject(error); // error in case calling RPC
                } else if (response.error) {
                    reject(new Error(response.error.message)); // possible error from blockchain
                } else if (response.result) {
                    if (onlyLastBlockInfo === true) {
                        resolve({
                            height: response.result.blocks,
                            hash: response.result.bestblockhash,
                        });
                    } else {
                        resolve(response.result);
                    }
                } else {
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }

    getBlockFilter(byHash) {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getblockfilter', [byHash], function callback(
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

    getBlockTxs(byHash) {
        return new Promise<any>((resolve, reject) => {
            RpcBitcoinClient.call('getblock', [byHash], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error); // error in case calling RPC
                } else if (response.error) {
                    reject(new Error(response.error.message)); // possible error from blockchain
                } else if (response.result && response.result.tx) {
                    resolve(response.result.tx);
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
    getRawTransactionInfo(byId: string, inBlockHash?: string) {
        return new Promise<any>((resolve, reject) => {
            let parametersArr = [byId, 1];
            if (inBlockHash) {
                parametersArr = [byId, 1, inBlockHash];
            }
            RpcBitcoinClient.call(
                'getrawtransaction',
                parametersArr,
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

    getBlockHash(byHeight: number) {
        return new Promise<string>((resolve, reject) => {
            RpcBitcoinClient.call(
                'getblockhash',
                [byHeight],
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
    ): CalculatedTotal {
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
