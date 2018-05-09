import type BigNumber from 'bignumber.js';
import type { EthereumUnitT, EthereumAddressT } from 'ethereum-types';

declare module 'web3' {
    declare type ProviderT = {
        host: string;
        timeout: number;
        isConnected: () => boolean;
        send: (payload: any) => any;
        sendAsync: (payload: any, callback: (error: Error, result: any) => void) => any;
    };

    declare class Web3T {
        static providers: {
            HttpProvider: (host: string, timeout?: number) => ProviderT;
        };

        constructor(ProviderT): Web3T;
        currentProvider: ProviderT;
        eth: Eth;

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

    declare class Eth {
        getGasPrice: (callback: (error: Error, gasPrice: string) => void) => void,
        getBalance: (address: string, callback: (error: Error, balance: BigNumber) => void) => void,
        getTransactionCount: (address: string, callback: (error: Error, result: number) => void) => void,
        getTransaction: (txid: string, callback: (error: Error, result: any) => void) => void,
        getBlockNumber: (callback: (error: Error, blockNumber: number) => void) => void,
        getBlock: (hash: string, callback: (error: Error, result: any) => void) => void,
        getAccounts: (callback: (error: Error, accounts: Array<EthereumAddressT>) => void) => void,
        sign: (payload: string, signer: EthereumAddressT) => Promise<string>,
        contract: (abi: Array<Object>) => ContractFactory,
        estimateGas: (options: any, callback: (error: Error, result: any) => void) => void,
        sendRawTransaction: (tx: any, callback: (error: Error, result: any) => void) => void,
        filter: (type: string) => Filter; // return intance with "watch"
    }

    declare export class Filter {
        watch: (callback: (error: ?Error, blockHash: ?string) => void | Promise<void>) => void,
        stopWatching: (callback: any) => void,
    }

    declare export class ContractFactory {
        // constructor(abi: Array<Object>);
        eth: Eth;
        abi: Array<Object>;
        at: (address: string, callback: ?(error: Error, contract: Contract) => void) => Contract; // TODO
    }

    declare export class Contract {
        name: {
            call: (callback: (error: Error, name: string) => void) => void;
        },
        symbol: {
            call: (callback: (error: Error, symbol: string) => void) => void;
        },
        decimals: {
            call: (callback: (error: Error, decimals: BigNumber) => void) => void;
        },
        balanceOf: (address: string, callback: (error: Error, balance: BigNumber) => void) => void,
        transfer: any,
    }

    declare export default typeof Web3T;
}



// 
// 



/*declare module 'web3' {

    module.exports = {
        eth:  {
            _requestManager: any;
            iban: {
                (iban: string): void;
                fromAddress: (address: string) => any;
                fromBban: (bban: string) => any;
                createIndirect: (options: any) => any;
                isValid: (iban: string) => boolean;
            };
            sendIBANTransaction: any;
            contract: (abi: any) => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            filter: (fil: any, callback: any, filterCreationErrorCallback: any) => {
                requestManager: any;
                options: any;
                implementation: {
                    [x: string]: any;
                };
                filterId: any;
                callbacks: any[];
                getLogsCallbacks: any[];
                pollFilters: any[];
                formatter: any;
                watch: (callback: any) => any;
                stopWatching: (callback: any) => any;
                get: (callback: any) => any;
            };
            namereg: () => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            icapNamereg: () => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            isSyncing: (callback: any) => {
                requestManager: any;
                pollId: string;
                callbacks: any[];
                lastSyncState: boolean;
                addCallback: (callback: any) => any;
                stopWatching: () => void;
            };
        }
    }
}
*/