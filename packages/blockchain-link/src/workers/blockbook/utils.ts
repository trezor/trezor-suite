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

const transformTarget = (target: VinVout, incoming: VinVout[]) => {
    return {
        n: target.n || 0,
        addresses: target.addresses,
        isAddress: target.isAddress,
        amount: target.value,
        coinbase: target.coinbase,
        isAccountTarget: incoming.includes(target) ? true : undefined,
    };
};

const sumVinVout = (
    vinVout: VinVout[],
    initialValue = '0',
    operation: 'sum' | 'reduce' = 'sum'
) => {
    const sum = vinVout.reduce((bn, v) => {
        if (typeof v.value !== 'string') return bn;
        return operation === 'sum' ? bn.plus(v.value) : bn.minus(v.value);
    }, new BigNumber(initialValue));
    return sum.toString();
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
    let totalSpent = tx.value;
    const totalInput = sumVinVout(vinLength ? tx.vin : []);
    const totalOutput = sumVinVout(voutLength ? tx.vout : []);

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
        targets = tx.vout.filter(o => internal.indexOf(o) < 0);
        // recalculate amount, amount spent is just a fee
        amount = tx.fees;
        totalSpent = amount;
    } else if (outgoing.length === 0 && (incoming.length > 0 || tokens.length > 0)) {
        // none of the input is mine but and output or token transfer is mine
        type = 'recv';
        amount = '0';
        if (incoming.length > 0) {
            targets = incoming;
            // recalculate amount, sum all incoming vout
            amount = sumVinVout(incoming, amount);
            totalSpent = amount;
        }
    } else {
        type = 'sent';
        // regular targets
        if (tokens.length === 0 && voutLength) {
            // filter account change addresses from output
            targets = tx.vout.filter(o => internal.indexOf(o) < 0);
        }
        // ethereum specific transaction
        if (tx.ethereumSpecific) {
            if (tokens.length > 0 || tx.ethereumSpecific.status === 0) {
                amount = tx.fees;
                totalSpent = amount;
            } else {
                amount = tx.value;
                totalSpent = new BigNumber(amount).plus(tx.fees ?? '0').toString();
            }
        } else if (voutLength) {
            // bitcoin-like transaction
            // sum all my inputs
            const myInputsSum = sumVinVout(outgoing, '0');
            // reduce sum by my outputs values
            totalSpent = sumVinVout(incoming, myInputsSum, 'reduce');
            amount = new BigNumber(totalSpent).minus(tx.fees ?? '0').toString();
        }
    }

    let rbf: boolean | undefined;
    if (vinLength) {
        tx.vin.forEach(vin => {
            if (typeof vin.sequence === 'number' && vin.sequence < 0xffffffff - 1) {
                rbf = true;
            }
        });
    }

    let fee = tx.fees;
    if (tx.ethereumSpecific && !tx.ethereumSpecific.gasUsed) {
        fee = new BigNumber(tx.ethereumSpecific.gasPrice)
            .times(tx.ethereumSpecific.gasLimit)
            .toString();
    }

    return {
        type,

        txid: tx.txid,
        blockTime: tx.blockTime,
        blockHeight: tx.blockHeight,
        blockHash: tx.blockHash,
        lockTime: tx.lockTime,

        amount,
        fee,
        totalSpent,

        targets: targets.filter(t => typeof t === 'object').map(t => transformTarget(t, incoming)),
        tokens,
        rbf,
        ethereumSpecific: tx.ethereumSpecific,
        details: {
            vin: tx.vin,
            vout: tx.vout,
            size: typeof tx.hex === 'string' ? tx.hex.length / 2 : 0,
            totalInput: totalInput ? totalInput.toString() : '0',
            totalOutput: totalOutput ? totalOutput.toString() : '0',
        },
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
    let misc: AccountInfo['misc'] = {};
    if (typeof payload.nonce === 'string') {
        misc.nonce = payload.nonce;
    }
    if (payload.erc20Contract) {
        const token = transformTokenInfo([
            { ...payload.erc20Contract, type: payload.erc20Contract.type || 'ERC20' },
        ]);
        if (token) {
            const [erc20Contract] = token;
            misc.erc20Contract = erc20Contract;
        }
    }
    if (Object.keys(misc).length < 1) {
        misc = undefined;
    }
    const descriptor = payload.address;
    const addresses = transformAddresses(payload.tokens);
    const tokens = transformTokenInfo(payload.tokens);
    const unconfirmed = new BigNumber(payload.unconfirmedBalance);
    // reduce or increase availableBalance
    const availableBalance =
        !unconfirmed.isNaN() && !unconfirmed.isZero()
            ? unconfirmed.plus(payload.balance).toString()
            : payload.balance;
    const empty =
        payload.txs === 0 &&
        payload.unconfirmedTxs === 0 &&
        new BigNumber(availableBalance).isZero();

    return {
        descriptor,
        balance: payload.balance,
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

export const transformAccountUtxo = (payload: BlockbookAccountUtxo): Utxo[] => {
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
