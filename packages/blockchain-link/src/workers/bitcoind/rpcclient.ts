import RpcBitcoinClient from 'node-bitcoin-rpc';
import RpcClientBatch from 'bitcoind-rpc-client';
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

        await Promise.all(
            batchArr.map(async oneBatch => {
                console.log(
                    `oneBatch of blockhashes with length ${oneBatch.length} wants to get blockFilters, before rpc send`
                );
                const hashes = await this.clientBatch.batch(oneBatch);
                console.log(
                    'filters for oneBatch with hashes was arrived with length: ',
                    hashes.length
                );

                blockHashes.push(hashes);

                oneBatch.forEach((oneCommand, index) => {
                    aggregatedFiltersAndHash.push({
                        filter: hashes[index].result.filter,
                        blockhash: oneCommand.params[0],
                    });
                });
            })
        );
        console.log('addFiltersToHashes completed, must be called 1 time');
        this.cachedFiltersHashes = aggregatedFiltersAndHash;
        return aggregatedFiltersAndHash;
    }

    async searchAddressInBlock(
        address: string,
        blockHash: string,
        blockFilter?: string
    ): Promise<boolean> {
        const decodedAddrObj = Base58check.decode(address, 'hex'); // TODO: find this method in utxo trezor lib
        const hexPubKey = `76a914${decodedAddrObj.data}88ac`; // TODO: find method for various adressess in uxo trezor lib

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
            console.log('was MATCHED');
            isMatched = true;
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
                    console.log(
                        'first if passed, vout:',
                        oneTxObj.rawTxData.vout,
                        Array.isArray(oneTxObj.rawTxData.vout)
                    );
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
                                console.log('found true', oneVout.scriptPubKey, walletAddr);
                                console.log('oneTxObj', oneTxObj);
                                oneTxObj.rawTxData.blockhash = oneTxObj.inBlockHash;
                                const tx = await this.convertRawTransactionToNormal(
                                    oneTxObj.rawTxData
                                );
                                const notif: AddressNotification = {
                                    address: walletAddr,
                                    tx,
                                };
                                returnTxs.push(notif);
                                console.log('returnTxs', returnTxs);
                            }
                        })
                    );
                }
            })
        );
        console.log('returnTxs zzz', returnTxs);
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
        const lastHeight: number = (await this.getBlockchainInfo(true)).height;
        const blocksArr: number[] = Array.from(Array(100000).keys()).reverse();

        const batchHashCommands: object = {};
        let actualProp = 'someProp';

        // divided into chunks due to limitations/errors in js/rpc (one chunk <= 100 000 elements)
        blocksArr.forEach((oneBlock, index) => {
            if (index % 100000 === 0) {
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
                    console.log('before batch execution for knowing blockhashes');
                    const hashes = await this.clientBatch.batch(batchHashCommands[oneBatch]);
                    blockHashes.push(hashes);
                    console.log('was received blockhashes with length', hashes.length);
                } catch (e) {
                    console.log('error inside batch hashes', e);
                }
            })
        );
        console.log('before addFiltersToHashes, must be called 1 time for all blockhashes');
        this.cachedFiltersHashes = await this.addFiltersToHashes(blockHashes);

        console.log('prepareBlockchainData init & return');
        return this.cachedFiltersHashes;
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

        console.log('collected confirmed blocks to find our addr + prev. blocks', returnArr); // we need to scan those and previous blocks
        return returnArr;
    }

    async getAccountinfo(payload: AccountInfoParams): Promise<object> {
        if (payload.details && (payload.details === 'tokens' || payload.details === 'basic')) {
            const mainAddrTxs = await this.getTxs(payload.descriptor);
            const balanceObj: TotalBalance = this.getAvailableBalance(
                mainAddrTxs.inputTxs,
                mainAddrTxs.voutTxs,
                payload.descriptor
            );
            // 1FxqeJa3gx35q9VEFJPp2yWb25bHmu8eGx
            console.log(
                'balanceObj.totalReceived.toFixed(8), balanceObj.totalSpent.toFixed(8)',
                balanceObj.totalReceived.toFixed(8),
                balanceObj.totalSpent.toFixed(8)
            );
            const returnObj = {
                address: payload.descriptor,
                balance: balanceObj.finalBalance,
                totalReceived: balanceObj.totalReceived,
                totalSent: balanceObj.totalSpent,
                unconfirmedBalance: '0',
                unconfirmedTxs: 0,
                txs: mainAddrTxs.allTxs.length,
                usedTokens: 20,
                // eslint-disable-next-line @typescript-eslint/no-array-constructor
                tokens: Array(),
            };

            console.log('returnObj', returnObj);
            return returnObj;
        }
        return {};
    }

    async getAccountInfoWithTokenBalances(payload: AccountInfoParams): Promise<object> {
        const mainAddrTxs = await this.getTxs(payload.descriptor);

        const returnObj = {
            address: payload.descriptor,
            balance: '0',
            totalReceived: '0',
            totalSent: '0',
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            txs: mainAddrTxs.allTxs.length,
            usedTokens: 20,
            // eslint-disable-next-line @typescript-eslint/no-array-constructor
            tokens: Array(),
        };

        for (let i = 0; i <= 20; i++) {
            returnObj.tokens.push({
                type: 'XPUBAddress',
                name: this.deriveXpub(payload.descriptor, BitcoinJsNetwork.bitcoin, i),
                path: `m/44'/1'/0'/0/${i}`,
                transfers: 0,
                decimals: 8,
            });
        }

        await Promise.all(
            returnObj.tokens.map(async oneTokenObj => {
                const txs = await this.getTxs(oneTokenObj.name);
                oneTokenObj.transfers = txs.allTxs.length;
            })
        );

        return returnObj;
    }

    async getTxs(byWalletAddr: string): Promise<GroupedTxs> {
        await this.prepareBlockchainData(); // 1FxqeJa3gx35q9VEFJPp2yWb25bHmu8eGx in 99701, 99700 tx blocks, 2 transactions
        const passedBlocks: PassedBlock[] = await this.getPassedBlocks(byWalletAddr);
        const allTxs: BlockhashTx[] = [];

        await Promise.all(
            passedBlocks.map(async onePassedBlock => {
                const allTxsForBlock: BlockhashTx[] = await this.getBlockTxs(
                    onePassedBlock.blockHash
                );
                allTxs.push(...allTxsForBlock);
            })
        );

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

        return { allTxs: foundedTxs, inputTxs, voutTxs };
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
            oneTx.tx.vout.forEach(oneVout => {
                if (oneVout.value) {
                    finalBalance = finalBalance.minus(new BigNumber(oneVout.value));
                    totalSpent = totalSpent.plus(new BigNumber(oneVout.value));
                }
            });
        });

        return { finalBalance, totalReceived, totalSpent };
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
                if (
                    oneTx.rawTxData.vin &&
                    Array.isArray(oneTx.rawTxData.vin) &&
                    oneTx.rawTxData.vin[0] &&
                    oneTx.rawTxData.vin[0].txid === onePassedTx.tx.txid
                ) {
                    foundedInTxs.push(oneTx);
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

    async convertRawTransactionToNormal(rawTxData: any): Promise<Transaction> {
        if (rawTxData.inBlockHash) {
            rawTxData.blockhash = rawTxData.inBlockHash;
        }
        console.log('rawTxData', rawTxData);
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

            // detecting the sender?
            const senderObj = inputTxs[0].vout.find(({ n }) => rawTxData.vin[0].vout === n);
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
                        console.log('doing calculations', totalTransactionIn.toFixed(8));
                    }
                });
            }
        }); // 0

        // get miner fee
        if (rawTxData.vout && Array.isArray(rawTxData.vout)) {
            let summOfVout: BigNumber = new BigNumber(0, 8);
            console.log('rawTxData.vout', rawTxData.vout);
            rawTxData.vout.forEach(oneOutTx => {
                summOfVout = summOfVout.plus(oneOutTx.value);
            });

            fee = totalTransactionIn.minus(summOfVout);
            console.log('doing calculations fee', fee.toFixed(8));
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
