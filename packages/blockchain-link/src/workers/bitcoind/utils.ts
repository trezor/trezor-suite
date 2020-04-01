import BigNumber from 'bignumber.js';

import {
    Transaction,
    TokenTransfer,
    TokenInfo,
    Address,
    AccountAddresses,
    AccountInfo,
} from '../../types';

import {
    AccountInfo as BlockbookAccountInfo,
    AccountUtxo as BlockbookAccountUtxo,
    Transaction as BlockbookTransaction,
    VinVout,
    BlockchainInfo,
    NetworkInfo,
} from '../../types/rpcbitcoind';

import { Utxo } from '../../types/responses';

export const transformServerInfo = (blockInfo: BlockchainInfo, netInfo: NetworkInfo) => {
    return {
        name: 'Bitcoin',
        shortcut: 'BTC',
        testnet: blockInfo.chain === 'test',
        version: netInfo.version,
        decimals: 8,
        blockHeight: blockInfo.blocks,
        blockHash: blockInfo.bestblockhash,
    };
};

type Addresses = (Address | string)[] | string;

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or targets are missing
    if (!addresses || !Array.isArray(addresses) || !targets || !Array.isArray(targets)) return [];

    const all: (string | null)[] = addresses.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && typeof a.address === 'string') return a.address;
        return null;
    });

    return targets.filter(t => {
        if (t && Array.isArray(t.addresses)) {
            return t.addresses.filter(a => all.indexOf(a) >= 0).length > 0;
        }
        return false;
    });
};

export const filterTokenTransfers = (
    addresses: Addresses,
    transfers: BlockbookTransaction['tokenTransfers']
): TokenTransfer[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or transfers are missing
    if (!addresses || !Array.isArray(addresses) || !transfers || !Array.isArray(transfers))
        return [];

    const all: (string | null)[] = addresses.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && typeof a.address === 'string') return a.address;
        return null;
    });

    return transfers
        .filter(tr => {
            if (tr && typeof tr === 'object') {
                return (tr.from && all.indexOf(tr.from) >= 0) || (tr.to && all.indexOf(tr.to) >= 0);
            }
            return false;
        })
        .map(tr => {
            const incoming = tr.from && all.indexOf(tr.from) >= 0;
            const outgoing = tr.to && all.indexOf(tr.to) >= 0;
            let type: TokenTransfer['type'] = 'unknown';
            if (incoming && outgoing) {
                type = 'self';
            } else {
                if (incoming) {
                    type = 'sent';
                }
                if (outgoing) {
                    type = 'recv';
                }
            }
            return {
                type,
                name: tr.name,
                symbol: tr.symbol,
                address: tr.token,
                decimals: tr.decimals || 0,
                amount: tr.value,
                from: tr.from,
                to: tr.to,
            };
        });
};

const transformTarget = (target: VinVout) => {
    return {
        addresses: target.addresses,
        isAddress: target.isAddress,
        amount: target.value,
        coinbase: target.coinbase,
    };
};

export const transformTransaction = (
    descriptor: string,
    addresses: AccountAddresses | undefined,
    tx: BlockbookTransaction
): Transaction => {
    // combine all addresses into array
    const myAddresses = addresses
        ? addresses.change.concat(addresses.used, addresses.unused)
        : [descriptor];

    const vinLength = Array.isArray(tx.vin) ? tx.vin.length : 0;
    const voutLength = Array.isArray(tx.vout) ? tx.vout.length : 0;
    const outgoing = filterTargets(myAddresses, tx.vin);
    const incoming = filterTargets(myAddresses, tx.vout);
    const internal = addresses ? filterTargets(addresses.change, tx.vout) : [];
    const tokens = filterTokenTransfers(myAddresses, tx.tokenTransfers);
    let type: Transaction['type'];
    let targets: VinVout[] = [];
    let amount = tx.value;

    // && !hasJoinsplits (from hd-wallet)
    if (outgoing.length === 0 && incoming.length === 0 && tokens.length === 0) {
        type = 'unknown';
    } else if (
        vinLength > 0 &&
        voutLength > 0 &&
        outgoing.length === vinLength &&
        incoming.length === voutLength
    ) {
        // all inputs and outputs are mine
        type = 'self';
        // recalculate amount, amount spent is just a fee
        amount = tx.fees;
    } else if (outgoing.length === 0 && (incoming.length > 0 || tokens.length > 0)) {
        // none of the input is mine but and output or token transfer is mine
        type = 'recv';
        amount = '0';
        if (incoming.length > 0) {
            if (Array.isArray(tx.vin)) {
                targets = tx.vin;
            }
            // recalculate amount, sum all incoming vout
            amount = incoming.reduce((prev, vout) => {
                if (typeof vout.value !== 'string') return prev;
                const bn = new BigNumber(prev).plus(vout.value);
                return bn.toString();
            }, amount);
        }
    } else {
        type = 'sent';
        // regular targets
        if (tokens.length === 0 && Array.isArray(tx.vout)) {
            // filter account receive and change addresses from output
            targets = tx.vout.filter(o => incoming.indexOf(o) < 0 && internal.indexOf(o) < 0);
        }
        // ethereum specific transaction
        if (tx.ethereumSpecific) {
            amount = tokens.length > 0 || tx.ethereumSpecific.status === 0 ? tx.fees : tx.value;
        } else if (Array.isArray(tx.vout)) {
            // bitcoin-like transaction
            // sum all my inputs
            const myInputsSum = outgoing.reduce((prev, vin) => {
                if (typeof vin.value !== 'string') return prev;
                const bn = new BigNumber(prev).plus(vin.value);
                return bn.toString();
            }, '0');
            // reduce sum by my outputs values
            amount = incoming.reduce((prev, vout) => {
                if (typeof vout.value !== 'string') return prev;
                const bn = new BigNumber(prev).minus(vout.value);
                return bn.toString();
            }, myInputsSum);
        }
    }

    let rbf: boolean | undefined;
    if (Array.isArray(tx.vin)) {
        tx.vin.forEach(vin => {
            if (typeof vin.sequence === 'number' && vin.sequence < 0xffffffff - 1) {
                rbf = true;
            }
        });
    }

    return {
        type,

        txid: tx.txid,
        blockTime: tx.blockTime,
        blockHeight: tx.blockHeight,
        blockHash: tx.blockHash,

        amount,
        fee: tx.fees,

        targets: targets.filter(t => typeof t === 'object').map(t => transformTarget(t)),
        tokens,
        rbf,
        ethereumSpecific: tx.ethereumSpecific,
    };
};

export const transformTokenInfo = (
    tokens: BlockbookAccountInfo['tokens']
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.reduce((arr, t) => {
        if (t.type !== 'ERC20') return arr;
        return arr.concat([
            {
                type: t.type,
                name: t.name,
                symbol: t.symbol,
                address: t.contract,
                balance: t.balance,
                decimals: t.decimals || 0,
            },
        ]);
    }, [] as TokenInfo[]);
    return info.length > 0 ? info : undefined;
};

export const transformAddresses = (
    tokens: BlockbookAccountInfo['tokens']
): AccountAddresses | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const addresses = tokens.reduce((arr, t) => {
        if (t.type !== 'XPUBAddress') return arr;
        return arr.concat([
            {
                address: t.name,
                path: t.path,
                transfers: t.transfers,
                balance: t.balance,
                sent: t.totalSent,
                received: t.totalReceived,
            },
        ]);
    }, [] as Address[]);

    if (addresses.length < 1) return undefined;
    const internal = addresses.filter(a => a.path.split('/')[4] === '1');
    const external = addresses.filter(a => internal.indexOf(a) < 0);

    return {
        change: internal,
        used: external.filter(a => a.transfers > 0),
        unused: external.filter(a => a.transfers === 0),
    };
};

export const transformAccountInfo = (payload: BlockbookAccountInfo): AccountInfo => {
    let page;
    if (typeof payload.page === 'number') {
        page = {
            index: payload.page,
            size: payload.itemsOnPage,
            total: payload.totalPages,
        };
    }
    let misc;
    if (typeof payload.nonce === 'string') {
        misc = { nonce: payload.nonce };
    }
    const descriptor = payload.address;
    const addresses = transformAddresses(payload.tokens);
    const tokens = transformTokenInfo(payload.tokens);
    const empty = payload.txs === 0 && payload.unconfirmedTxs === 0;
    const unconfirmed = new BigNumber(payload.unconfirmedBalance);
    // reduce or increase availableBalance
    const availableBalance = payload.balance.dividedBy(100000000).toFixed(8);
    console.log('availableBalance', availableBalance);
    return {
        descriptor,
        balance: availableBalance,
        availableBalance,
        empty,
        tokens,
        addresses,
        history: {
            total: payload.txs,
            tokens:
                typeof payload.nonTokenTxs === 'number'
                    ? payload.txs - payload.nonTokenTxs
                    : undefined,
            unconfirmed: payload.unconfirmedTxs,
            transactions: payload.transactions
                ? payload.transactions.map(t => transformTransaction(descriptor, addresses, t))
                : undefined,
        },
        misc,
        page,
    };
};

export const transformAccountUtxo = (payload: BlockbookAccountUtxo[]): Utxo[] => {
    return payload.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        amount: utxo.value,
        blockHeight: utxo.height,
        address: utxo.address,
        path: utxo.path,
        confirmations: utxo.confirmations,
        coinbase: utxo.coinbase,
    }));
};
