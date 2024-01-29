import BigNumber from 'bignumber.js';

import type {
    Utxo,
    Transaction,
    TokenTransfer,
    TokenInfo,
    Address,
    AccountAddresses,
    AccountInfo,
    InternalTransfer,
} from '@trezor/blockchain-link-types';
import type {
    ServerInfo,
    AccountInfo as BlockbookAccountInfo,
    AccountUtxo as BlockbookAccountUtxo,
    Transaction as BlockbookTransaction,
    VinVout,
} from '@trezor/blockchain-link-types/lib/blockbook';

import { Addresses, filterTargets, enhanceVinVout, sumVinVout, transformTarget } from './utils';

export const transformServerInfo = (payload: ServerInfo) => ({
    name: payload.name,
    shortcut: payload.shortcut,
    testnet: payload.testnet,
    version: payload.version,
    decimals: payload.decimals,
    blockHeight: payload.bestHeight,
    blockHash: payload.bestHash,
    consensusBranchId: payload.backend?.consensus
        ? parseInt(payload.backend.consensus.chaintip, 16) // parse from hex string
        : undefined,
});

export const filterTokenTransfers = (
    addresses: Addresses,
    transfers: BlockbookTransaction['tokenTransfers'],
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
        .filter(transfer => {
            if (transfer && typeof transfer === 'object') {
                return (
                    (transfer.from && all.indexOf(transfer.from) >= 0) ||
                    (transfer.to && all.indexOf(transfer.to) >= 0)
                );
            }

            return false;
        })
        .map(transfer => {
            const isIncoming = transfer.from && all.indexOf(transfer.from) >= 0;
            const isOutgoing = transfer.to && all.indexOf(transfer.to) >= 0;

            let type: TokenTransfer['type'];
            if (isIncoming && isOutgoing) {
                type = 'self';
            } else if (isIncoming) {
                type = 'sent';
            } else {
                type = 'recv';
            }

            const tokenTransfer = {
                ...transfer,
                type,
                decimals: transfer.decimals || 0,
                amount: transfer.value || '',
                standard: transfer.type,
            };
            delete tokenTransfer.value;

            return tokenTransfer;
        });
};

export const filterEthereumInternalTransfers = (
    address: string | undefined,
    ethereumSpecific: BlockbookTransaction['ethereumSpecific'],
): InternalTransfer[] => {
    const internalTransfers = ethereumSpecific?.internalTransfers;

    // neither addresses or transfers are missing
    if (!address || !internalTransfers?.length) {
        return [];
    }

    return (
        internalTransfers
            // type 1 and 2 are filtered out (contract creating and destruction)
            .filter(({ type, from, to }) => type === 0 && [from, to].includes(address))
            .map(({ from, to, value }) => {
                const isIncoming = from === address;
                const isOutgoing = to === address;

                let type: InternalTransfer['type'];
                if (isIncoming && isOutgoing) {
                    type = 'self';
                } else if (isIncoming) {
                    type = 'sent';
                } else {
                    type = 'recv';
                }

                return {
                    type,
                    amount: value,
                    from,
                    to,
                };
            })
    );
};

// Lighter version of AccountAddresses for tx classification
type TransformAddresses = {
    used: { address: string }[];
    unused: { address: string }[];
    change: { address: string }[];
};

export const isTxFailed = (tx: BlockbookTransaction) =>
    !(!tx.blockHeight || tx.blockHeight < 0) && tx.ethereumSpecific?.status === 0;

export const transformTransaction = (
    tx: BlockbookTransaction,
    addressesOrDescriptor?: TransformAddresses | string,
): Transaction => {
    const [addresses, descriptor] =
        typeof addressesOrDescriptor === 'object'
            ? [addressesOrDescriptor, undefined]
            : [undefined, addressesOrDescriptor];

    // combine all addresses into array
    const myAddresses = addresses
        ? addresses.change.concat(addresses.used, addresses.unused).map(a => a.address)
        : (descriptor && [descriptor]) || [];

    const inputs = Array.isArray(tx.vin) ? tx.vin : [];
    const totalInput = inputs.reduce(sumVinVout, 0);
    const myInputs = filterTargets(myAddresses, tx.vin);
    const myTotalInput = myInputs.reduce(sumVinVout, 0);

    const outputs = Array.isArray(tx.vout) ? tx.vout : [];
    const totalOutput = outputs.reduce(sumVinVout, 0);
    const myOutputs = filterTargets(myAddresses, tx.vout);
    const myTotalOutput = myOutputs.reduce(sumVinVout, 0);

    const myTokens = filterTokenTransfers(myAddresses, tx.tokenTransfers);
    const myInternalTransfers = filterEthereumInternalTransfers(descriptor, tx.ethereumSpecific);

    const isNonChangeOutput = (o: VinVout) =>
        addresses ? filterTargets(addresses.change, tx.vout).indexOf(o) < 0 : true;

    const isNonZero = (o: VinVout) => o.value && o.value !== '0';

    let type: Transaction['type'];
    let amount: string;
    let targets: VinVout[];

    if (tx.ethereumSpecific?.createdContract) {
        type = 'contract';
        amount = tx.value;
        targets = [];
    } else if (myInputs.length) {
        // Some input is mine -> sent, self or joint

        if (myInputs.length < inputs.length) {
            // Some input is external -> joint
            // later we could use Wasabi heuristics:
            // https://github.com/zkSNACKs/WalletWasabi/blob/1edaaabd901fe7d129e30eb84e3ff317897971a9/WalletWasabi/Blockchain/Transactions/SmartTransaction.cs#L46-L49

            type = 'joint';
            targets = [];
            amount = new BigNumber(myTotalOutput).minus(myTotalInput).toString();
        } else if (myOutputs.length < outputs.length || !outputs.length) {
            // Some output is external or no output at all -> sent

            type = 'sent';
            targets = myTokens.length
                ? outputs.filter(isNonZero)
                : outputs.filter(isNonChangeOutput);
            amount =
                !outputs.length || tx.ethereumSpecific
                    ? tx.value
                    : new BigNumber(myTotalInput)
                          .minus(myTotalOutput)
                          .minus(tx.fees ?? '0')
                          .toString();
        } else {
            // All inputs & outputs are mine -> self

            type = 'self';
            amount = tx.fees;
            const intentionalOutputs = outputs.filter(isNonChangeOutput);
            targets = intentionalOutputs.length ? intentionalOutputs : outputs;
        }
    } else if (myOutputs.length || myTokens.length || myInternalTransfers.length) {
        type = 'recv';
        amount = myTotalOutput.toString();
        targets = myOutputs;

        const transfers = [...myTokens, ...myInternalTransfers];
        const isSentTransferAvailable = transfers.find(t => t.type === 'sent');
        const isNoRecvTransferAvailable = transfers.find(t => t.type !== 'recv');

        if (isSentTransferAvailable) {
            type = 'sent';
        } else if (!myOutputs.length && isNoRecvTransferAvailable) {
            type = 'self';
        }
    } else {
        // No input or output is mine -> unknown
        type = 'unknown';
        amount = tx.value;
        targets = [];
    }

    type = isTxFailed(tx) ? 'failed' : type;

    const rbf =
        tx.rbf || inputs.find(i => typeof i.sequence === 'number' && i.sequence < 0xffffffff - 1)
            ? true
            : undefined;

    const fee =
        tx.ethereumSpecific && !tx.ethereumSpecific.gasUsed
            ? new BigNumber(tx.ethereumSpecific?.gasPrice ?? '0')
                  .times(tx.ethereumSpecific.gasLimit)
                  .toString()
            : tx.fees;

    // some instances of bb don't send vsize yet
    const feeRate = tx.vsize
        ? new BigNumber(fee).div(tx.vsize).decimalPlaces(2).toString()
        : undefined;

    // some instances of bb don't send size yet
    const size = tx.size || (typeof tx.hex === 'string' ? tx.hex.length / 2 : 0);

    return {
        type,
        txid: tx.txid,
        hex: tx.hex,
        blockTime: tx.blockTime,
        blockHeight: tx.blockHeight,
        blockHash: tx.blockHash,
        lockTime: tx.lockTime,
        amount,
        fee,
        vsize: tx.vsize, // some instances of bb don't send vsize yet
        feeRate,
        targets: targets
            .filter(target => typeof target === 'object')
            .map(target => transformTarget(target, myOutputs)),
        tokens: myTokens,
        internalTransfers: myInternalTransfers,
        rbf,
        ethereumSpecific: tx.ethereumSpecific && {
            ...tx.ethereumSpecific,
            gasPrice: tx.ethereumSpecific.gasPrice ?? '0', // even if it shouldn't, `null` sometimes came from Erigon
        },
        details: {
            vin: inputs.map(enhanceVinVout(myAddresses)),
            vout: outputs.map(enhanceVinVout(myAddresses)),
            size,
            totalInput: totalInput.toString(),
            totalOutput: totalOutput.toString(),
        },
    };
};

export const transformTokenInfo = (
    tokens: BlockbookAccountInfo['tokens'],
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.reduce((arr, token) => {
        if (token.type === 'XPUBAddress') return arr;

        return arr.concat([
            {
                ...token,
                decimals: token.decimals || 0,
            },
        ]);
    }, [] as TokenInfo[]);

    return info.length > 0 ? info : undefined;
};

export const transformAddresses = (
    tokens: BlockbookAccountInfo['tokens'],
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
            addrTxCount: payload.addrTxCount,
            total: payload.txs,
            tokens:
                typeof payload.nonTokenTxs === 'number'
                    ? payload.txs - payload.nonTokenTxs
                    : undefined,
            unconfirmed: payload.unconfirmedTxs,
            transactions: payload.transactions
                ? payload.transactions.map(t => transformTransaction(t, addresses ?? descriptor))
                : undefined,
        },
        misc,
        page,
        stakingPools: payload?.stakingPools,
    };
};

export const transformAccountUtxo = (payload: BlockbookAccountUtxo): Utxo[] =>
    payload.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        amount: utxo.value,
        blockHeight: utxo.height,
        address: utxo.address,
        path: utxo.path,
        confirmations: utxo.confirmations,
        coinbase: utxo.coinbase,
    }));
