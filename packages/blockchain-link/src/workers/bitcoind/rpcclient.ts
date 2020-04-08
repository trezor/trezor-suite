import RpcBitcoinClient from 'node-bitcoin-rpc';
import RpcClientBatch from 'bitcoind-rpc-client';
import Bitcore from 'bitcore-lib';
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
    DerivedAddress,
    AggregatedFiltersAndHash,
    PassedBlock,
    BlockhashTx,
    TotalBalance,
    GroupedTxs,
    AccountUtxo,
    AccountUtxoParams,
    Fee,
    AccountInfo,
    XPUBAddress,
} from '../../types/rpcbitcoind';
import {
    HDNode as BitcoinJsHDNode,
    networks as BitcoinJsNetwork,
    address as BitcoinJsAddress,
    script as BitcoinJsScript,
} from '@trezor/utxo-lib';
import BigNumber from 'bignumber.js';
import GCSFilter from 'golomb';
import Base58check from 'base58check';
import XpubOperations from './xpubOperations';
import * as Bjs from 'bitcoinjs-lib';

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
    clientBatch: RpcClientBatch;
    cachedFiltersHashes: AggregatedFiltersAndHash[] | undefined;

    constructor(loginData: LoginData) {
        this.loginData = loginData;
        RpcBitcoinClient.init(
            loginData.host,
            loginData.port,
            loginData.username,
            loginData.password,
            100
        );
        this.clientBatch = new RpcClientBatch({
            host: '78.47.39.234',
            port: 8332,
            user: 'rpc',
            pass: 'rpcdsfcxvxctrnfnvkkqkjvjtjnbnnkbvibnifnbkdfbdfkbndfkbnfdbfdnkeckvncxq1',
        });
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

    async addFiltersToHashes(
        hashesSeparated: Array<any>
    ): Promise<Array<AggregatedFiltersAndHash>> {
        const batchArr: any[] = [];
        const aggregatedFiltersAndHash: AggregatedFiltersAndHash[] = [];
        console.log('addFiltersToHashes started, must be called 1 time');
        hashesSeparated.forEach(oneArrWithHashes => {
            const tempBatchArr = oneArrWithHashes.map(oneHash => {
                return { method: 'getblockfilter', params: [oneHash.result] };
            });
            batchArr.push(tempBatchArr);
        });
        const blockHashes: object[] = [];

        const startTime2 = new Date().getTime();
        await Promise.all(
            batchArr.map(async (oneBatch, index) => {
                await this.giveBreak(this.getRandomNumber(1, 20));
                console.log(
                    `oneBatch of blockhashes with length ${oneBatch.length} wants to get blockFilters, before rpc send`
                );
                try {
                    // const someString = JSON.stringify(oneBatch);
                    // console.log('someString length', someString.length);
                    const hashes = await this.clientBatch.batch(oneBatch);
                    blockHashes.push(hashes);

                    oneBatch.forEach((oneCommand, index) => {
                        aggregatedFiltersAndHash.push({
                            filter: hashes[index].result.filter,
                            blockhash: oneCommand.params[0],
                        });
                    });

                    console.log(
                        'filters for oneBatch with hashes was arrived with length: ',
                        hashes.length
                    );
                } catch (e) {
                    console.log(
                        'error inside getblockfilter one batch; oneBatch.lenght',
                        oneBatch.length,
                        e
                    );
                    console.log('batchArr.length, index', batchArr.length, index);
                    throw e;
                }
            })
        );
        console.log(
            (new Date().getTime() - startTime2) / 1000,
            'seconds',
            'addFiltersToHashes completed, must be called 1 time'
        );
        this.cachedFiltersHashes = aggregatedFiltersAndHash;
        return aggregatedFiltersAndHash;
    }

    async searchAddressInBlock(
        address: string,
        blockHash: string,
        blockFilter?: string,
        publickKey?: string
    ): Promise<boolean> {
        const addressObj = Bitcore.Address.fromString(address);
        let script;
        switch (addressObj.type) {
            case 'witnessscripthash': {
                script = Bitcore.Script.buildWitnessV0Out(address);
                break;
            }
            case 'witnesspubkeyhash': {
                script = Bitcore.Script.buildPublicKeyHashOut(publickKey);
                break;
            }
            case 'scripthash': {
                script = Bitcore.Script.buildWitnessV0Out(address);
                break;
            }
            case 'pubkeyhash': {
                script = Bitcore.Script.buildPublicKeyHashOut(address);
                break;
            }
            default: {
                script = Bitcore.Script.buildPublicKeyHashOut(address);
                break;
            }
        }
        const hexPubKey = script.toHex();

        let hexAdditionalKey;
        if (publickKey) {
            // addition search in old coinbase txs with public key in scriptPub
            const additionalAddressMode = Bitcore.Address.fromPublicKey(publickKey);
            const additionalScript = Bitcore.buildPublicKeyOut(additionalAddressMode);
            hexAdditionalKey = additionalScript.toHex();
        }

        let block_filter: Buffer;
        let filterInitial;

        if (blockFilter) {
            block_filter = Buffer.from(blockFilter, 'hex');
        } else {
            filterInitial = await this.getBlockFilter(blockHash);
            block_filter = Buffer.from(filterInitial.filter, 'hex');
        }

        const P = 19;
        const filter = GCSFilter.fromNBytes(P, block_filter);
        const block_hash = Buffer.from(blockHash, 'hex');
        const key = block_hash.reverse().slice(0, 16);
        const search = Buffer.from(hexPubKey, 'hex');
        let isMatched = false;
        if (filter.match(key, search) === true) {
            console.log('was MATCHED', address, blockHash);
            isMatched = true;
        }

        // possible search in PayToPublicKey Scripts
        if (publickKey && typeof hexAdditionalKey !== 'undefined') {
            const searchAdditional = Buffer.from(hexAdditionalKey, 'hex');

            if (filter.match(key, searchAdditional) === true) {
                console.log('was MATCHED in additional search', address, blockHash);
                isMatched = true;
            }
        }
        return isMatched;
    }

    async getBatchedRawTxs(txsAndBlock: Array<BlockhashTx>): Promise<Array<any>> {
        const batchArr = txsAndBlock.map(oneTx => {
            return { method: 'getrawtransaction', params: [oneTx.txid, 1, oneTx.inBlockHash] };
        });
        const rawTxsData = await this.clientBatch.batch(batchArr);
        return rawTxsData;
    }

    async iterateOutTxsInBlock(
        walletAddr: string,
        allTxs: Array<any>
    ): Promise<AddressNotification[]> {
        const returnTxs: AddressNotification[] = [];
        await Promise.all(
            allTxs.map(async oneTxObj => {
                if (oneTxObj.rawTxData.vout && Array.isArray(oneTxObj.rawTxData.vout)) {
                    await Promise.all(
                        oneTxObj.rawTxData.vout.map(async oneVout => {
                            if (
                                oneVout.scriptPubKey &&
                                oneVout.scriptPubKey.addresses &&
                                this.checkAddressInArr(
                                    oneVout.scriptPubKey.addresses,
                                    walletAddr
                                ) === true
                            ) {
                                oneTxObj.rawTxData.blockhash = oneTxObj.inBlockHash;
                                const tx = await this.convertRawTransactionToNormal(
                                    oneTxObj.rawTxData
                                );
                                const notif: AddressNotification = {
                                    address: walletAddr,
                                    tx,
                                };
                                returnTxs.push(notif);
                            }
                        })
                    );
                }
            })
        );

        return returnTxs;
    }

    checkAddressInArr(arrAddr: Array<string>, neededAddr: string) {
        return arrAddr.some(oneAddr => {
            return neededAddr === oneAddr;
        });
    }

    // async improveAccountsInfo(accountsArr): Promise<DerivedAddress[]> {
    //     let improvedAccounts: DerivedAddress[] = [];
    //     console.log('improveAccountsInfo go');
    //     await Promise.all(
    //         (improvedAccounts = accountsArr.map(async oneAccount => {
    //             oneAccount.txs = await this.getTxCountInAllBlocks(oneAccount.name);
    //             return oneAccount;
    //         }))
    //     );
    //     return improvedAccounts;
    // }

    async prepareBlockchainData(): Promise<Array<AggregatedFiltersAndHash>> {
        if (this.cachedFiltersHashes) {
            console.log('prepareBlockchainData get from cache');
            return this.cachedFiltersHashes; // TODO: create update check if new block arrived
        }

        console.log('prepareBlockchainData started without cache');
        const startTime = new Date().getTime();
        const lastHeight: number = (await this.getBlockchainInfo(true)).height;
        const blocksArr: number[] = Array.from(Array(250000).keys()).reverse(); // 1FbRhCQ6f9C4jiETP2pgGLG5AzBj7JiLJN
        // const blocksArr: number[] = [624823];
        // const blocksArr = this.createArrayWithRange(500000, 600000, 1); // test purposes 484823, 624823
        const batchHashCommands: object = {};
        let actualProp = 'someProp';

        // divided into chunks due to limitations/errors in js/rpc (one chunk <= 100 000 elements)
        blocksArr.forEach((oneBlock, index) => {
            if (index % 500 === 0) {
                actualProp = `someProp${index}`;
                batchHashCommands[actualProp] = [];
                batchHashCommands[actualProp].push({ method: 'getblockhash', params: [oneBlock] });
            } else {
                batchHashCommands[actualProp].push({ method: 'getblockhash', params: [oneBlock] });
            }
        });
        const blockHashes: object[] = [];

        await Promise.all(
            Object.keys(batchHashCommands).map(async oneBatch => {
                try {
                    const hashes = await this.clientBatch.batch(batchHashCommands[oneBatch]);
                    blockHashes.push(hashes);
                } catch (e) {
                    console.log('error inside batch hashes', e);
                    throw e;
                }
            })
        );
        console.log(
            (new Date().getTime() - startTime) / 1000,
            'seconds',
            'it took time to send and receive a hash of blocks, amount of blocks:',
            blocksArr.length
        );
        try {
            this.cachedFiltersHashes = await this.addFiltersToHashes(blockHashes);
        } catch (e) {
            console.log('error inside await this.addFiltersToHashes', e);
            throw e;
        }

        console.log('prepareBlockchainData init & return');
        return this.cachedFiltersHashes;
    }

    giveBreak(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    getRandomNumber(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    async getPassedBlocks(walletAddr: string): Promise<Array<PassedBlock>> {
        const cachedFilters = await this.prepareBlockchainData();
        const returnArr: PassedBlock[] = [];

        await Promise.all(
            cachedFilters.map(async oneRecord => {
                const result = await this.searchAddressInBlock(
                    walletAddr,
                    oneRecord.blockhash,
                    oneRecord.filter
                );
                if (result === true) {
                    returnArr.push({ walletAddr, blockHash: oneRecord.blockhash });
                }
            })
        );

        // add previous blocks
        await Promise.all(
            returnArr.map(async oneRecord => {
                const result = await this.getBlockInfo(oneRecord.blockHash);

                const isBlockAlreadyExist = returnArr.some(oneElem => {
                    return oneElem.blockHash === result.previousblockhash;
                });
                if (isBlockAlreadyExist === false) {
                    returnArr.push({ walletAddr, blockHash: result.previousblockhash });
                }
            })
        );

        // add one next block blocks
        await Promise.all(
            returnArr.map(async oneRecord => {
                const result = await this.getBlockInfo(oneRecord.blockHash);

                const isBlockAlreadyExist = returnArr.some(oneElem => {
                    if (result.nextblockhash && result.nextblockhash.length > 5) {
                        return oneElem.blockHash === result.previousblockhash;
                    }
                    return true;
                });

                if (isBlockAlreadyExist === false) {
                    returnArr.push({ walletAddr, blockHash: result.previousblockhash });
                }
            })
        );

        return returnArr;
    }

    async getAccountUtxo(walletAddr: string): Promise<Array<AccountUtxo>> {
        const mainAddrTxs = await this.getTxs(walletAddr);
        const unspent: AddressNotification[] = this.calculateUnspent(
            mainAddrTxs.inputTxs,
            mainAddrTxs.voutTxs,
            walletAddr
        );

        const returnObj: AccountUtxo[] = [];
        unspent.forEach(oneUnspent => {
            oneUnspent.tx.vout.forEach(oneVout => {
                if (oneVout.isAddress && oneVout.addresses && Array.isArray(oneVout.addresses)) {
                    oneVout.addresses.forEach(oneAddr => {
                        if (oneAddr.toLowerCase() === walletAddr.toLowerCase()) {
                            returnObj.push({
                                txid: oneUnspent.tx.txid,
                                vout: oneVout.n,
                                value: oneVout.value as string,
                                height: oneUnspent.tx.blockHeight,
                                address: walletAddr,
                                path: '',
                                confirmations: oneUnspent.tx.confirmations,
                            });
                        }
                    });
                }
            });
        });
        return returnObj;
    }
    // 1FxqeJa3gx35q9VEFJPp2yWb25bHmu8eGx
    async getAccountinfo(payload: AccountInfoParams): Promise<AccountInfo> {
        if (Bitcore.Address.isValid(payload.descriptor) === false) {
            throw new Error('You must provide a valid address');
        }

        const mainAddrTxs = await this.getTxs(payload.descriptor);
        const balanceObj: TotalBalance = this.getAvailableBalance(
            mainAddrTxs.inputTxs,
            mainAddrTxs.voutTxs,
            payload.descriptor
        );

        const returnObj: AccountInfo = {
            address: payload.descriptor,
            balance: balanceObj.finalBalance,
            totalReceived: balanceObj.totalReceived,
            totalSent: balanceObj.totalSpent,
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            itemsOnPage: 25,
            totalPages: 1,
            txs: mainAddrTxs.allTxs.length,
        };

        return returnObj;
    }

    async getAccountTokens(payload: AccountInfoParams): Promise<AccountInfo> {
        const bip84obj = new XpubOperations();
        if (bip84obj.isExtendedPublicKey(payload.descriptor) === false) {
            throw new Error('You must provide a valid extended public key');
        }

        const returnObj: AccountInfo = {
            address: payload.descriptor,
            balance: new BigNumber(0),
            totalReceived: new BigNumber(0),
            totalSent: new BigNumber(0),
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            txs: 0,
            itemsOnPage: 25,
            totalPages: 1,
        };

        const tokens: XPUBAddress[] = [];
        for (let i = 0; i <= 20; i++) {
            tokens.push({
                type: 'XPUBAddress',
                name: bip84obj.isXpub(payload.descriptor)
                    ? bip84obj.getAddressLegacy(i, payload.descriptor)
                    : bip84obj.getAddressSegwitFromvPubOrZPub(i, payload.descriptor),
                path: bip84obj.isXpub(payload.descriptor)
                    ? `m/44'/0'/0'/0/${i}`
                    : `m/89'/0'/0'/0/${i}`,
                transfers: 0,
                balance: '0',
                totalReceived: '0',
                totalSent: '0',
            });
        }

        await Promise.all(
            tokens.map(async oneTokenObj => {
                const txs = await this.getTxs(oneTokenObj.name);
                oneTokenObj.transfers = txs.allTxs.length;

                const balanceObj: TotalBalance = this.getAvailableBalance(
                    txs.inputTxs,
                    txs.voutTxs,
                    oneTokenObj.name
                );

                returnObj.txs += txs.allTxs.length;
                returnObj.balance = returnObj.balance.plus(balanceObj.finalBalance);
                returnObj.totalReceived = returnObj.totalReceived.plus(balanceObj.totalReceived);
                returnObj.totalSent = returnObj.totalSent.plus(balanceObj.totalSpent);
            })
        );

        returnObj.tokens = tokens;
        return returnObj;
    }

    async getAccountInfoWithTokenBalances(payload: AccountInfoParams): Promise<AccountInfo> {
        const bip84obj = new XpubOperations();
        if (bip84obj.isExtendedPublicKey(payload.descriptor) === false) {
            throw new Error('You must provide a valid extended public key');
        }

        const returnObj: AccountInfo = {
            address: payload.descriptor,
            balance: new BigNumber(0),
            totalReceived: new BigNumber(0),
            totalSent: new BigNumber(0),
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            txs: 0,
            itemsOnPage: 25,
            totalPages: 1,
        };

        const tokens: XPUBAddress[] = [];
        for (let i = 0; i <= 20; i++) {
            tokens.push({
                type: 'XPUBAddress',
                name: bip84obj.isXpub(payload.descriptor)
                    ? bip84obj.getAddressLegacy(i, payload.descriptor)
                    : bip84obj.getAddressSegwitFromvPubOrZPub(i, payload.descriptor),
                path: bip84obj.isXpub(payload.descriptor)
                    ? `m/44'/0'/0'/0/${i}`
                    : `m/89'/0'/0'/0/${i}`,
                transfers: 0,
                balance: '0',
                totalReceived: '0',
                totalSent: '0',
            });
        }

        await Promise.all(
            tokens.map(async oneTokenObj => {
                const txs = await this.getTxs(oneTokenObj.name);
                oneTokenObj.transfers = txs.allTxs.length;

                const balanceObj: TotalBalance = this.getAvailableBalance(
                    txs.inputTxs,
                    txs.voutTxs,
                    oneTokenObj.name
                );
                oneTokenObj.balance = balanceObj.finalBalance.toFixed(8);
                oneTokenObj.totalReceived = balanceObj.totalReceived.toFixed(8);
                oneTokenObj.totalSent = balanceObj.totalSpent.toFixed(8);

                returnObj.txs += txs.allTxs.length;
                returnObj.balance = returnObj.balance.plus(balanceObj.finalBalance);
                returnObj.totalReceived = returnObj.totalReceived.plus(balanceObj.totalReceived);
                returnObj.totalSent = returnObj.totalSent.plus(balanceObj.totalSpent);
            })
        );

        returnObj.tokens = tokens;
        return returnObj;
    }

    async getAccountInfoWithTxs(payload: AccountInfoParams): Promise<AccountInfo> {
        const bip84obj = new XpubOperations();
        if (bip84obj.isExtendedPublicKey(payload.descriptor) === false) {
            throw new Error('You must provide a valid extended public key');
        }

        const returnObj: AccountInfo = {
            address: payload.descriptor,
            balance: new BigNumber(0),
            totalReceived: new BigNumber(0),
            totalSent: new BigNumber(0),
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            txs: 0,
            itemsOnPage: 25,
            totalPages: 1,
        };

        const tokens: XPUBAddress[] = [];
        for (let i = 0; i <= 20; i++) {
            tokens.push({
                type: 'XPUBAddress',
                name: bip84obj.isXpub(payload.descriptor)
                    ? bip84obj.getAddressLegacy(i, payload.descriptor)
                    : bip84obj.getAddressSegwitFromvPubOrZPub(i, payload.descriptor),
                path: bip84obj.isXpub(payload.descriptor)
                    ? `m/44'/0'/0'/0/${i}`
                    : `m/89'/0'/0'/0/${i}`,
                transfers: 0,
                balance: '0',
                totalReceived: '0',
                totalSent: '0',
            });
        }

        await Promise.all(
            tokens.map(async oneTokenObj => {
                const txs = await this.getTxs(oneTokenObj.name);
                oneTokenObj.transfers = txs.allTxs.length;

                const balanceObj: TotalBalance = this.getAvailableBalance(
                    txs.inputTxs,
                    txs.voutTxs,
                    oneTokenObj.name
                );
                oneTokenObj.balance = balanceObj.finalBalance.toFixed(8);
                oneTokenObj.totalReceived = balanceObj.totalReceived.toFixed(8);
                oneTokenObj.totalSent = balanceObj.totalSpent.toFixed(8);

                txs.allTxs.forEach(oneTxNotif => {
                    // eslint-disable-next-line no-unused-expressions
                    returnObj.transactions?.push(oneTxNotif.tx);
                });

                returnObj.txs += txs.allTxs.length;
                returnObj.balance = returnObj.balance.plus(balanceObj.finalBalance);
                returnObj.totalReceived = returnObj.totalReceived.plus(balanceObj.totalReceived);
                returnObj.totalSent = returnObj.totalSent.plus(balanceObj.totalSpent);
            })
        );

        returnObj.tokens = tokens;
        return returnObj;
    }

    async getTxs(byWalletAddr: string): Promise<GroupedTxs> {
        await this.prepareBlockchainData(); // 1FxqeJa3gx35q9VEFJPp2yWb25bHmu8eGx in 99701, 99700 tx blocks, 2 transactions
        const passedBlocks: PassedBlock[] = await this.getPassedBlocks(byWalletAddr);
        const allTxs: BlockhashTx[] = [];

        const getBlockTxsBatch: Array<any> = [];

        await Promise.all(
            passedBlocks.map(async onePassedBlock => {
                getBlockTxsBatch.push({
                    method: 'getblock',
                    params: [onePassedBlock.blockHash, 2],
                });
            })
        );
        const blocksWithTxs = await this.clientBatch.batch(getBlockTxsBatch);
        blocksWithTxs.forEach(oneBlock => {
            const txs = oneBlock.result.tx.map(oneTx => {
                return { txid: oneTx.txid, inBlockHash: oneBlock.result.hash, rawTxData: oneTx };
            });
            allTxs.push(...txs);
        });

        const foundedTxs: AddressNotification[] = [];
        // find transactons in VOUT [real it is input tx on needed wallet; + balance]
        const voutTxs: AddressNotification[] = await this.iterateOutTxsInBlock(
            byWalletAddr,
            allTxs
        );

        foundedTxs.push(...voutTxs);

        // find transactons in VIN [real it is output tx on needed wallet; - balance]
        const inputTxs = await this.findInputTxs(allTxs, foundedTxs, byWalletAddr);
        foundedTxs.push(...inputTxs);

        const foundedTxsFiltered = this.removeDuplicatesTx(foundedTxs);
        const inputTxsFiltered = this.removeDuplicatesTx(inputTxs);

        return { allTxs: foundedTxsFiltered, inputTxs: inputTxsFiltered, voutTxs };
    }

    removeDuplicatesTx(givenArr: AddressNotification[]): Array<AddressNotification> {
        const foundedTxsFiltered: AddressNotification[] = [];

        givenArr.forEach((oneTx: AddressNotification) => {
            if (foundedTxsFiltered.length === 0) {
                foundedTxsFiltered.push(oneTx);
            }

            const isExist = foundedTxsFiltered.some((oneFilteredTx: AddressNotification) => {
                return oneFilteredTx.tx.txid.toLowerCase() === oneTx.tx.txid.toLowerCase();
            });
            if (isExist === false) {
                foundedTxsFiltered.push(oneTx);
            }
        });
        // debug
        // const foundedTxsFilteredDebug: AddressNotification[] = [];
        // foundedTxsFiltered.forEach((oneTx: AddressNotification) => {
        //     if (
        //         oneTx.tx.txid !== 'caf963882bd4f2bb8731e788c48770788099874139fcdb7f2dd2ef7e02fc6a6c'
        //     ) {
        //         foundedTxsFilteredDebug.push(oneTx);
        //     }
        // });
        // return foundedTxsFilteredDebug;
        return foundedTxsFiltered;
    }

    getAvailableBalance(
        spended: AddressNotification[],
        received: AddressNotification[],
        neededAddr: string
    ): TotalBalance {
        const decodedAddrObj = Base58check.decode(neededAddr, 'hex'); // TODO: find this method in utxo trezor lib
        const hexPubKey = `76a914${decodedAddrObj.data}88ac`; // TODO: find method for various adressess in uxo trezor lib

        let finalBalance = new BigNumber(0, 8);
        let totalReceived = new BigNumber(0, 8);
        let totalSpent = new BigNumber(0, 8);

        received.forEach((oneTx: AddressNotification) => {
            oneTx.tx.vout.forEach(oneVout => {
                if (oneVout.hex === hexPubKey) {
                    if (oneVout.value) {
                        finalBalance = finalBalance.plus(new BigNumber(oneVout.value));
                        totalReceived = totalReceived.plus(new BigNumber(oneVout.value));
                    }
                }
            });
        });

        spended.forEach((oneTx: AddressNotification) => {
            oneTx.tx.vin.forEach(oneVin => {
                if (
                    oneVin.value &&
                    oneVin.isAddress === true &&
                    oneVin.addresses &&
                    Array.isArray(oneVin.addresses) &&
                    oneVin.addresses[0] &&
                    oneVin.addresses[0].toLowerCase() === neededAddr.toLowerCase()
                ) {
                    finalBalance = finalBalance.minus(new BigNumber(oneVin.value));
                    totalSpent = totalSpent.plus(new BigNumber(oneVin.value));
                }
            });
        });

        return { finalBalance, totalReceived, totalSpent };
    }

    calculateUnspent(
        spended: AddressNotification[],
        received: AddressNotification[],
        neededAddr: string
    ): AddressNotification[] {
        const unspent = [...received];

        if (received.length > spended.length) {
            spended.forEach(oneSpentTx => {
                oneSpentTx.tx.vin.forEach(oneVinTx => {
                    unspent.forEach((oneRecievedTx, index) => {
                        if (oneVinTx.txid?.toLowerCase() === oneRecievedTx.tx.txid.toLowerCase()) {
                            unspent.splice(index, 1);
                        }
                    });
                });
            });
        }

        return unspent;
    }

    createArrayWithRange(start: number, end: number, step: number): Array<number> {
        return Array.from(
            Array.from(Array(Math.ceil((end - start) / step)).keys()),
            x => start + x * step
        );
    }

    async findInputTxs(
        allTxs: BlockhashTx[],
        passedVoutTxs: AddressNotification[],
        walletAddr: string
    ): Promise<Array<AddressNotification>> {
        const foundedInTxs: BlockhashTx[] = [];
        const returnTxs: AddressNotification[] = [];

        passedVoutTxs.forEach(onePassedTx => {
            allTxs.forEach(oneTx => {
                if (oneTx.rawTxData.vin && Array.isArray(oneTx.rawTxData.vin)) {
                    oneTx.rawTxData.vin.forEach(oneVin => {
                        if (oneVin.txid === onePassedTx.tx.txid) {
                            foundedInTxs.push(oneTx);
                        }
                    });
                }
            });
        });

        await Promise.all(
            foundedInTxs.map(async (oneTx: BlockhashTx) => {
                oneTx.rawTxData.blockhash = oneTx.inBlockHash;
                const tx = await this.convertRawTransactionToNormal(oneTx.rawTxData);
                returnTxs.push({ address: walletAddr, tx });
            })
        );

        return returnTxs;
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
        return new Promise<Array<BlockhashTx>>((resolve, reject) => {
            RpcBitcoinClient.call('getblock', [byHash, 2], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error); // error in case calling RPC
                } else if (response.error) {
                    reject(new Error(response.error.message)); // possible error from blockchain
                } else if (response.result && response.result.tx) {
                    const returnObj: BlockhashTx[] = response.result.tx.map(oneTx => {
                        return { txid: oneTx.txid, inBlockHash: byHash, rawTxData: oneTx };
                    });
                    resolve(returnObj);
                } else {
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }

    pushTx(hex: string) {
        return new Promise<string>((resolve, reject) => {
            RpcBitcoinClient.call('sendrawtransaction', [hex], function callback(
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
                        // console.log('response.result', response.result);
                        resolve(response.result);
                    } else {
                        reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                    }
                }
            );
        });
    }

    async getEstimateFee(payload: EstimateFeeParams): Promise<Array<Fee>> {
        const batchArr = payload.blocks?.map(oneBlock => {
            let feeMode = 'CONSERVATIVE';
            if (payload.specific?.conservative === false) {
                feeMode = 'ECONOMICAL';
            }
            return { method: 'estimatesmartfee', params: [oneBlock, feeMode] };
        });

        const feeResponse = await this.clientBatch.batch(batchArr);

        const feeReturn = feeResponse.map(oneResponse => {
            if (oneResponse.error) {
                throw new Error(oneResponse.error);
            }

            const obj: Fee = {
                feePerUnit: new BigNumber(oneResponse.result.feerate)
                    .multipliedBy(100000000)
                    .toFixed(),
            };
            if (payload.specific?.txsize) {
                const feePerTx = new BigNumber(oneResponse.result.feerate)
                    .multipliedBy(new BigNumber(payload.specific?.txsize))
                    .multipliedBy(100000000);
                obj.feePerTx = feePerTx.toFixed(8);
            }
            return obj;
        });
        return feeReturn;
    }

    async convertRawTransactionToNormal(rawTxData: any): Promise<Transaction> {
        if (rawTxData.inBlockHash) {
            rawTxData.blockhash = rawTxData.inBlockHash;
        }
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
            typeof rawTxData.vin[0].vout !== 'undefined'
        ) {
            // get input tx's
            const inputTxs: any = [];
            await Promise.all(
                rawTxData.vin.map(async oneInput => {
                    const oneTx = await this.getRawTransactionInfo(oneInput.txid);
                    inputTxs.push(oneTx);
                })
            );

            // transform vin
            const vins: VinVout[] = rawTxData.vin.map((oneVin, index) => {
                const vinReturnObj: VinVout = {
                    txid: oneVin.txid,
                    vout: oneVin.vout,
                    sequence: oneVin.sequence,
                    n: index,
                    addresses: [],
                    isAddress: false,
                    hex: oneVin.scriptSig.hex,
                };

                inputTxs.forEach(oneTx => {
                    // detecting the sender?
                    const senderObj = oneTx.vout.find(oneVout => {
                        return oneVin.vout === oneVout.n;
                    });
                    if (typeof senderObj === 'undefined') {
                        console.log('senderObj === undefined oneTx.vout', oneTx.vout);
                        console.log('senderObj === undefined oneVin.vout', oneVin.vout);

                        console.log('senderObj === undefined rawtxdata', rawTxData);
                        console.log('senderObj === undefined input onetx', oneTx);
                    }

                    if (typeof senderObj === 'undefined') {
                        return; // terminate forEach for debug purposes
                    }

                    const sender = senderObj.scriptPubKey.addresses[0];

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
                                vinReturnObj.addresses = [sender];
                                vinReturnObj.isAddress = true;
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
            const totalAmounts = this.getTxTotalAmountAndFee(inputTxs, rawTxData, 'fgfgfgf');
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
                    // if ( TODO: CHECK IF THIS IS NEEDED
                    //     oneOut.scriptPubKey &&
                    //     oneOut.scriptPubKey.addresses &&
                    //     Array.isArray(oneOut.scriptPubKey.addresses) &&
                    //     oneOut.scriptPubKey.addresses[0] &&
                    //     oneOut.scriptPubKey.addresses[0].toLowerCase() === sender.toLowerCase()
                    // ) {
                    totalTransactionIn = totalTransactionIn.plus(oneOut.value);
                    // }
                });
            }
        }); // 0

        // get miner fee
        if (rawTxData.vout && Array.isArray(rawTxData.vout)) {
            let summOfVout: BigNumber = new BigNumber(0, 8);

            rawTxData.vout.forEach(oneOutTx => {
                summOfVout = summOfVout.plus(oneOutTx.value);
            });

            fee = totalTransactionIn.minus(summOfVout);
        }

        if (totalTransactionIn.eq(new BigNumber(0)) === true) {
            throw new Error(
                'The amount in the transaction is zero. There may be an error in the calculations or changes in the bitcoind API.'
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
