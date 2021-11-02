import BigNumber from 'bignumber.js';
import {
    BlockfrostUtxos,
    BlockfrostTransaction,
    BlockfrostAccountInfo,
    ParseAssetResult,
} from '../../types/blockfrost';
import { Utxo } from '../../types/responses';
import { VinVout } from '../../types/blockbook';
import {
    Transaction,
    AccountInfo,
    AccountAddresses,
    TokenInfo,
    TokenTransfer,
} from '../../types/common';
import { filterTargets, sumVinVout, transformTarget } from '../utils';

export const transformUtxos = (utxos: BlockfrostUtxos[]): Utxo[] => {
    const result: Utxo[] = [];
    utxos.forEach(utxo =>
        utxo.utxoData.amount.forEach(u => {
            result.push({
                address: utxo.address,
                txid: utxo.utxoData.tx_hash,
                confirmations: utxo.blockInfo.confirmations,
                blockHeight: utxo.blockInfo.height || 0,
                amount: u.quantity,
                vout: utxo.utxoData.output_index,
                path: utxo.path,
                cardanoSpecific: {
                    unit: u.unit,
                },
            });
        })
    );
    return result;
};

const hexToString = (input: string): string => {
    let str = '';
    for (let n = 0; n < input.length; n += 2) {
        str += String.fromCharCode(parseInt(input.substr(n, 2), 16));
    }

    return str;
};

export const getSubtype = (tx: BlockfrostTransaction) => {
    const withdrawal = tx.txData.withdrawal_count > 0;
    if (withdrawal) {
        return 'withdrawal';
    }

    const registrations = tx.txData.stake_cert_count;
    const delegations = tx.txData.delegation_count;
    if (registrations === 0 && delegations === 0) return null;

    if (delegations > 0) {
        // transaction could both register staking address and delegate stake at once. In that case we treat it as "delegation"
        return 'stake_delegation';
    }
    if (registrations > 0) {
        if (new BigNumber(tx.txData.deposit).gt(0)) {
            return 'stake_registration';
        }
        return 'stake_deregistration';
    }
    return null;
};

export const parseAsset = (hex: string): ParseAssetResult => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);
    const assetName = hexToString(assetNameInHex);

    return {
        policyId,
        assetName,
    };
};

export const transformTokenInfo = (
    tokens: BlockfrostAccountInfo['tokens']
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.map(t => {
        const { assetName } = parseAsset(t.unit);
        return {
            type: 'BLOCKFROST',
            name: t.fingerprint!, // this is safe as fingerprint is defined for all tokens except lovelace and lovelace is never included in account.tokens
            address: t.fingerprint!,
            symbol: assetName,
            balance: t.quantity,
            decimals: t.decimals,
        };
    });

    return info.length > 0 ? info : undefined;
};

export const transformInputOutput = (
    data: BlockfrostTransaction['txUtxos']['inputs'] | BlockfrostTransaction['txUtxos']['outputs'],
    asset = 'lovelace'
): VinVout[] =>
    data.map(utxo => ({
        n: utxo.output_index,
        addresses: [utxo.address],
        isAddress: true,
        value: utxo.amount.find(a => a.unit === asset)?.quantity ?? '0',
    }));

export const filterTokenTransfers = (
    accountAddress: AccountAddresses,
    tx: BlockfrostTransaction,
    type: Transaction['type']
): TokenTransfer[] => {
    const myAddresses = accountAddress.change.concat(accountAddress.used, accountAddress.unused);
    const tokens = Array.from(
        new Set(tx.txData.output_amount.filter(asset => asset.unit !== 'lovelace'))
    );

    const transfers = tokens.reduce<TokenTransfer[]>((transfers, asset) => {
        const inputs = transformInputOutput(tx.txUtxos.inputs, asset.unit);
        const outputs = transformInputOutput(tx.txUtxos.outputs, asset.unit);
        const outgoing = filterTargets(myAddresses, inputs);
        const incoming = filterTargets(myAddresses, outputs);
        if (incoming.length === 0 && outgoing.length === 0) return transfers;

        let amount = '0';
        // const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
        if (type === 'sent') {
            const myInputsSum = sumVinVout(outgoing, '0');
            // reduce sum by my outputs values
            amount = sumVinVout(incoming, myInputsSum, 'reduce');
        } else if (type === 'recv') {
            if (incoming.length > 0) {
                amount = sumVinVout(incoming, '0');
            }
        }

        if (amount === '0' || !asset.fingerprint) return transfers;

        const { assetName } = parseAsset(asset.unit);
        transfers.push({
            type,
            name: assetName,
            symbol: assetName,
            address: asset.fingerprint,
            decimals: 0,
            amount: amount.toString(),
            from:
                type === 'sent' || type === 'self'
                    ? tx.address
                    : tx.txUtxos.inputs.find(i => i.amount.find(a => a.unit === asset.unit))
                          ?.address,
            to:
                type === 'recv'
                    ? tx.address
                    : tx.txUtxos.outputs.find(i => i.amount.find(a => a.unit === asset.unit))
                          ?.address,
        });
        return transfers;
    }, []);

    return transfers;
};

export const transformTransaction = (
    descriptor: string,
    accountAddress: AccountAddresses | undefined,
    blockfrostTxData: BlockfrostTransaction
): Transaction => {
    const myAddresses = accountAddress
        ? accountAddress.change.concat(accountAddress.used, accountAddress.unused)
        : [descriptor];

    let type: Transaction['type'];
    let targets: VinVout[] = [];
    let amount =
        blockfrostTxData.txData.output_amount.find(b => b.unit === 'lovelace')?.quantity || '0';
    const fee = blockfrostTxData.txData.fees;
    let totalSpent = amount;
    const inputs = transformInputOutput(blockfrostTxData.txUtxos.inputs);
    const outputs = transformInputOutput(blockfrostTxData.txUtxos.outputs);
    const vinLength = Array.isArray(inputs) ? inputs.length : 0;
    const voutLength = Array.isArray(outputs) ? outputs.length : 0;
    const outgoing = filterTargets(myAddresses, inputs);
    const incoming = filterTargets(myAddresses, outputs);
    const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
    const totalInput = sumVinVout(vinLength ? inputs : []);
    const totalOutput = sumVinVout(voutLength ? outputs : []);

    if (outgoing.length === 0 && incoming.length === 0) {
        type = 'unknown';
    } else if (
        vinLength > 0 &&
        voutLength > 0 &&
        outgoing.length === vinLength &&
        incoming.length === voutLength
    ) {
        // all inputs and outputs are mine
        type = 'self';
        targets = outputs.filter(o => internal.indexOf(o) < 0);
        // recalculate amount, amount spent is just a fee
        amount = blockfrostTxData.txData.fees;
        totalSpent = amount;
    } else if (outgoing.length === 0 && incoming.length > 0) {
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
        targets = outputs.filter(o => internal.indexOf(o) < 0);
        // regular targets
        if (voutLength) {
            // bitcoin-like transaction
            // sum all my inputs
            const myInputsSum = sumVinVout(outgoing, '0');
            // reduce sum by my outputs values
            totalSpent = sumVinVout(incoming, myInputsSum, 'reduce');
            amount = new BigNumber(totalSpent).minus(fee ?? '0').toString();
        }
    }

    const tokens = accountAddress
        ? filterTokenTransfers(accountAddress, blockfrostTxData, type)
        : [];

    return {
        type,
        txid: blockfrostTxData.txHash,
        blockTime: blockfrostTxData.blockInfo.time,
        blockHeight: blockfrostTxData.blockInfo.height || undefined,
        blockHash: blockfrostTxData.blockInfo.hash,
        amount,
        fee,
        totalSpent,
        targets: targets.map(t => transformTarget(t, incoming)),
        tokens,
        cardanoSpecific: {
            subtype: getSubtype(blockfrostTxData),
        },
        details: {
            vin: inputs,
            vout: outputs,
            size: blockfrostTxData.txData.size,
            totalInput: totalInput ? totalInput.toString() : '0',
            totalOutput: totalOutput ? totalOutput.toString() : '0',
        },
    };
};

export const transformAccountInfo = (info: BlockfrostAccountInfo): AccountInfo => {
    const blockfrostTxs = info.history.transactions;

    const result = {
        ...info,
        tokens: transformTokenInfo(info.tokens),
        history: {
            ...info.history,
            transactions: !blockfrostTxs
                ? []
                : blockfrostTxs?.map(tx =>
                      transformTransaction(info.descriptor, info.addresses, tx)
                  ),
        },
    };

    return result;
};
