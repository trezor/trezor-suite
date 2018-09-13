/* @flow */

import type BigNumber from 'bignumber.js';
import type { EthereumUnitT, EthereumAddressT } from 'ethereum-types';

declare module 'web3' {
    declare type HttpProviderT = {
        host: string;
        timeout: number;
        isConnected: () => boolean;
        send: (payload: any) => any;
        sendAsync: (payload: any, callback: (error: Error, result: any) => void) => any;
    };

    declare type WebsocketProviderT = {
        connection: {
            close: () => void;
        }; // WebSocket type
        on: (type: string, callback: () => any) => void;
        removeAllListeners: (type: string) => void;
        reset: () => void;
        connected: boolean;
    }

    declare class Web3T {
        static providers: {
            HttpProvider: (host: string, timeout?: number) => HttpProviderT;
            WebsocketProvider: (host: string, options?: any) => WebsocketProviderT;
        };

        // constructor(HttpProviderT): Web3T;
        constructor(WebsocketProviderT): Web3T;
        // currentProvider: HttpProviderT;
        currentProvider: WebsocketProviderT;
        eth: Eth;
        utils: Utils;

        toHex: (str: string | number) => string;
        isAddress: (address: string) => boolean;
        toWei: (number: BigNumber, unit?: EthereumUnitT) => BigNumber;
        toWei: (number: string, unit?: EthereumUnitT) => string;
        toDecimal: (number: BigNumber) => number;
        toDecimal: (number: string) => number;
        soliditySha3: (payload: string | number | BigNumber | Object) => String;

        fromWei: (number: string, unit?: EthereumUnitT) => string;
        version: {
            api: string;
            network: string;
            // and many more
        }

    }

    declare export type EstimateGasOptions = {
        to: string;
        data: string;
        value?: string;
        gasPrice?: string;
    }

    declare export type RawTransaction = {
        id: string;
    }

    declare export type TransactionStatus = {
        blockHash: string,
        blockNumber: ?number,
        from: string,
        gas: number,
        gasPrice: BigNumber,
        hash: string,
        input: string,
        nonce: number,
        r: string,
        s: string,
        v: string,
        to: string,
        transactionIndex: number,
        value: BigNumber
    }

    declare export type TransactionReceipt = {
        blockHash: string,
        blockNumber: number,
        contractAddress: ?string,
        cumulativeGasUsed: number,
        from: string,
        gasUsed: number,
        logs: Array<any>,
        status: string,
        to: string,
        transactionHash: string,
        transactionIndex: number
    }

    //declare function F_CardanoGetAddress(params: (P.$Common & CARDANO.$CardanoGetAddress)): Promise<CARDANO.CardanoGetAddress$>;
    //declare function F_CardanoGetAddress(params: (P.$Common & { bundle: Array<CARDANO.$CardanoGetAddress> })): Promise<CARDANO.CardanoGetAddress$$>;

    declare type PromiseEvent<T> = {
        once: typeof F_PromiseEventOn;
        on: typeof F_PromiseEventOn;
        off: (type: string, callback: Function) => PromiseEvent<T>;
        then: () => (result: T) => PromiseEvent<T>;
        catch: () => (error: Error) => PromiseEvent<T>;
    }

    declare function F_PromiseEventOn<T>(type: 'transactionHash', callback: (hash: string) => void): PromiseEvent<T>;
    declare function F_PromiseEventOn<T>(type: 'receipt', callback: (receipt: TransactionReceipt) => void): PromiseEvent<T>;
    declare function F_PromiseEventOn<T>(type: 'confirmation', callback: (confirmations: number, receipt: TransactionReceipt) => void): PromiseEvent<T>;
    declare function F_PromiseEventOn<T>(type: 'error', callback: (error: Error) => void): PromiseEvent<T>;

    declare class Eth {
        getBalance: (address: string) => Promise<string>;
        getTransactionCount: (address: string) => Promise<number>;
        estimateGas: (options: EstimateGasOptions) => Promise<number>;
        getGasPrice: () => Promise<string>;
        getBlockNumber: () => Promise<number>;
        Contract: (abi: Array<Object>, options?: any) => Contract;
        sendSignedTransaction: (tx: string) => PromiseEvent<TransactionReceipt>;
        getTransaction: (txid: string) => Promise<TransactionStatus>;
        getTransactionReceipt: (txid: string) => Promise<TransactionReceipt>;
        subscribe: (type: string, callback: Function) => any;
    }

    declare export class Filter {
        watch: (callback: (error: ?Error, blockHash: ?string) => void | Promise<void>) => void,
        stopWatching: (callback: any) => void,
    }

    declare type ContractMethod<T> = {
        call: () => Promise<T>;
    }

    declare export class Contract {
        clone: () => Contract;

        options: {
            address: string;
            jsonInterface: JSON;
        };

        methods: {
            name: () => ContractMethod<string>;
            symbol: () => ContractMethod<string>;
            decimals: () => ContractMethod<number>;
            balanceOf: (address: string) => ContractMethod<string>;
            transfer: (to: string, amount: any) => {
                encodeABI: () => string;
            }
        };
    }

    declare class Utils {
        toHex: (str: string | number) => string;
        hexToNumberString: (str: string) => string;

        isAddress: (address: string) => boolean;
        toWei: (number: BigNumber, unit?: EthereumUnitT) => BigNumber;
        toWei: (number: string, unit?: EthereumUnitT) => string;
        toDecimal: (number: BigNumber) => number;
        toDecimal: (number: string) => number;
        soliditySha3: (payload: string | number | BigNumber | Object) => String;
    }

    declare export default typeof Web3T;
}