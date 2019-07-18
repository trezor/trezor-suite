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
    ServerInfo,
    AccountInfo as BlockbookAccountInfo,
    AccountUtxo as BlockbookAccountUtxo,
    Transaction as BlockbookTransaction,
    VinVout,
} from '../../types/blockbook';

import { Utxo } from '../../types/responses';

export const transformServerInfo = (payload: ServerInfo) => {
    return {
        name: payload.name,
        shortcut: payload.shortcut,
        testnet: payload.testnet,
        version: payload.version,
        decimals: payload.decimals,
        blockHeight: payload.bestHeight,
        blockHash: payload.bestHash,
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
            } else if (incoming) {
                type = 'sent';
            } else if (outgoing) {
                type = 'recv';
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

    const inLength = Array.isArray(tx.vin) ? tx.vin.length : 0;
    const outLength = Array.isArray(tx.vout) ? tx.vout.length : 0;
    const outgoing = filterTargets(myAddresses, tx.vin);
    const incoming = filterTargets(myAddresses, tx.vout);
    const internal = addresses ? filterTargets(addresses.change, tx.vout) : [];
    const tokens = filterTokenTransfers(myAddresses, tx.tokenTransfers);
    let type: Transaction['type'];
    let targets: VinVout[] = [];

    // && !hasJoinsplits (from hd-wallet)
    if (outgoing.length === 0 && incoming.length === 0 && tokens.length === 0) {
        type = 'unknown';
    } else if (
        inLength > 0 &&
        outLength > 0 &&
        outgoing.length === inLength &&
        incoming.length === outLength
    ) {
        // all inputs and outputs are mine
        type = 'self';
    } else if (outgoing.length === 0 && (incoming.length > 0 || tokens.length > 0)) {
        // none of the input is mine but and output or token transfer is mine
        type = 'recv';
        if (incoming.length > 0 && Array.isArray(tx.vin)) {
            targets = tx.vin;
        }
    } else {
        type = 'sent';
        if (tokens.length === 0 && Array.isArray(tx.vout)) {
            // filter account receive and change addresses from output
            targets = tx.vout.filter(o => incoming.indexOf(o) < 0 && internal.indexOf(o) < 0);
        }
    }

    return {
        type,

        txid: tx.txid,
        blockTime: tx.blockTime,
        blockHeight: tx.blockHeight,
        blockHash: tx.blockHash,

        amount: tx.value,
        fee: tx.fees,

        targets: targets.filter(t => typeof t === 'object').map(t => transformTarget(t)),
        tokens,
    };
};

export const transformTokenInfo = (
    tokens: BlockbookAccountInfo['tokens']
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens) || tokens.length < 1) return undefined;
    return tokens.reduce(
        (arr, t) => {
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
        },
        [] as TokenInfo[]
    );
};

export const transformAddresses = (
    tokens: BlockbookAccountInfo['tokens']
): AccountAddresses | undefined => {
    if (!tokens || !Array.isArray(tokens) || tokens.length < 1) return undefined;
    const addresses = tokens.reduce(
        (arr, t) => {
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
        },
        [] as Address[]
    );

    if (addresses.length === 0) return undefined;
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
    const empty = payload.txs === 0;
    const unconfirmed = new BigNumber(payload.unconfirmedBalance);
    // reduce availableBalance if unconfirmed balance is lower than 0
    const availableBalance = unconfirmed.lt(0)
        ? unconfirmed.plus(payload.balance).toString()
        : payload.balance;

    return {
        descriptor,
        balance: payload.balance,
        availableBalance,
        empty,
        tokens: transformTokenInfo(payload.tokens),
        addresses,
        history: {
            total: payload.txs,
            tokens: payload.nonTokenTxs ? payload.txs - payload.nonTokenTxs : undefined,
            unconfirmed: payload.unconfirmedTxs,
            transactions: payload.transactions
                ? payload.transactions.map(t => transformTransaction(descriptor, addresses, t))
                : undefined,
        },
        misc,
        page,
    };
};

export const transformAccountUtxo = (payload: BlockbookAccountUtxo): Utxo[] => {
    return payload.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        amount: utxo.value,
        blockHeight: utxo.height,
        address: utxo.address,
        path: utxo.path,
        confirmations: utxo.confirmations,
    }));
};
