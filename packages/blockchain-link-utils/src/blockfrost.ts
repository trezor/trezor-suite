import BigNumber from 'bignumber.js';

import type {
    BlockfrostUtxos,
    BlockfrostTransaction,
    BlockfrostAccountInfo,
    ParseAssetResult,
} from '@trezor/blockchain-link-types/lib/blockfrost';
import type { VinVout } from '@trezor/blockchain-link-types/lib/blockbook';
import type {
    Utxo,
    Transaction,
    AccountInfo,
    AccountAddresses,
    TokenInfo,
    TokenTransfer,
    TransferType,
} from '@trezor/blockchain-link-types/lib/common';

import { enhanceVinVout, filterTargets, sumVinVout, transformTarget } from './utils';

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
        }),
    );
    return result;
};

const hexToString = (input: string): string => {
    let str = '';
    for (let n = 0; n < input.length; n += 2) {
        str += String.fromCharCode(parseInt(input.substring(n, n + 2), 16));
    }

    return str;
};

const getSubtype = (tx: Pick<BlockfrostTransaction, 'txData'>) => {
    const withdrawal = tx.txData.withdrawal_count > 0;
    if (withdrawal) {
        return 'withdrawal';
    }

    const registrations = tx.txData.stake_cert_count;
    const delegations = tx.txData.delegation_count;
    if (registrations === 0 && delegations === 0) return;

    if (registrations > 0) {
        if (new BigNumber(tx.txData.deposit).gt(0)) {
            // transaction could both register staking address and delegate stake at the same time. In that case we treat it as "stake registration"
            return 'stake_registration';
        }
        return 'stake_deregistration';
    }

    if (delegations > 0) {
        return 'stake_delegation';
    }
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
    tokens: BlockfrostAccountInfo['tokens'],
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.map(token => {
        const { assetName } = parseAsset(token.unit);
        return {
            type: 'BLOCKFROST',
            name: token.fingerprint!, // this is safe as fingerprint is defined for all tokens except lovelace and lovelace is never included in account.tokens
            contract: token.unit,
            symbol: assetName || token.fingerprint!,
            balance: token.quantity,
            decimals: token.decimals,
        };
    });

    return info.length > 0 ? info : undefined;
};

export const transformInputOutput = (
    data: BlockfrostTransaction['txUtxos']['inputs'] | BlockfrostTransaction['txUtxos']['outputs'],
    asset = 'lovelace',
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
    type: TransferType,
): TokenTransfer[] => {
    const transfers: TokenTransfer[] = [];
    const myNonChangeAddresses = accountAddress.used.concat(accountAddress.unused);
    const myAddresses = accountAddress.change.concat(myNonChangeAddresses);
    tx.txUtxos.outputs.forEach(output => {
        output.amount
            .filter(a => a.unit !== 'lovelace')
            .forEach(asset => {
                const token = asset.unit;
                const inputs = transformInputOutput(tx.txUtxos.inputs, token);
                const outputs = transformInputOutput(tx.txUtxos.outputs, token);
                const outgoing = filterTargets(myAddresses, inputs); // inputs going from account address
                const incoming = filterTargets(myAddresses, outputs); // outputs to account address
                const isChange = accountAddress.change.find(a => a.address === output.address);

                if (incoming.length === 0 && outgoing.length === 0) return null;

                const incomingForOutput = filterTargets(
                    myNonChangeAddresses,
                    transformInputOutput([output], token),
                );

                let amount = '0';
                if (type === 'sent') {
                    amount = isChange ? '0' : asset.quantity;
                } else if (type === 'recv') {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                } else if (type === 'self' && !isChange) {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                }

                // fingerprint is always defined on tokens
                if (amount === '0' || !asset.fingerprint) return null;

                const { assetName } = parseAsset(token);
                transfers.push({
                    type,
                    name: asset.fingerprint,
                    symbol: assetName || asset.fingerprint,
                    contract: asset.unit,
                    decimals: asset.decimals,
                    amount: amount.toString(),
                    from:
                        type === 'sent' || type === 'self'
                            ? tx.address
                            : tx.txUtxos.inputs.find(i => i.amount.find(a => a.unit === token))
                                  ?.address || '',
                    to: type === 'recv' ? tx.address : output.address,
                });
            });
    });

    return transfers.filter(t => !!t) as TokenTransfer[];
};

export const transformTransaction = (
    descriptor: string,
    accountAddress: AccountAddresses | undefined,
    blockfrostTxData: BlockfrostTransaction,
): Transaction => {
    const myAddresses = accountAddress
        ? accountAddress.change
              .concat(accountAddress.used, accountAddress.unused)
              .map(a => a.address)
        : [descriptor];

    let type: Transaction['type'];
    let targets: VinVout[] = [];
    let amount: BigNumber.Value =
        blockfrostTxData.txData.output_amount.find(b => b.unit === 'lovelace')?.quantity || '0';
    const fee = blockfrostTxData.txData.fees;

    // total withdrawal amount for withdrawal transaction (sent to self tx)
    let withdrawal: string | undefined;

    // refundable fee for registering staking address (sent to self tx with stake registration cert)
    let deposit: string | undefined;

    const inputs = transformInputOutput(blockfrostTxData.txUtxos.inputs);
    const outputs = transformInputOutput(blockfrostTxData.txUtxos.outputs);
    const vinLength = Array.isArray(inputs) ? inputs.length : 0;
    const voutLength = Array.isArray(outputs) ? outputs.length : 0;
    const outgoing = filterTargets(myAddresses, inputs);
    const incoming = filterTargets(myAddresses, outputs);
    const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
    const totalInput = inputs.reduce(sumVinVout, 0);
    const totalOutput = outputs.reduce(sumVinVout, 0);

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

        if (blockfrostTxData.txData.withdrawal_count > 0) {
            // output including fee is larger than the sum of all inputs,
            // so there must be more coin somewhere and that's the withdrawal amount
            withdrawal = new BigNumber(totalOutput)
                .plus(blockfrostTxData.txData.fees)
                .minus(totalInput)
                .toString();
        }

        if (new BigNumber(blockfrostTxData.txData.deposit).gt(0)) {
            // deposit paid for stake address registration
            deposit = blockfrostTxData.txData.deposit;
        }
    } else if (outgoing.length === 0 && incoming.length > 0) {
        // none of the input is mine but and output or token transfer is mine
        type = 'recv';
        amount = '0';
        if (incoming.length > 0) {
            targets = incoming;
            // recalculate amount, sum all incoming vout
            amount = incoming.reduce(sumVinVout, 0);
        }
    } else {
        type = 'sent';
        targets = outputs.filter(o => internal.indexOf(o) < 0);
        // regular targets
        if (voutLength) {
            // bitcoin-like transaction
            // sum all my inputs
            const myInputsSum = outgoing.reduce(sumVinVout, 0);
            // reduce sum by my outputs values
            const totalSpent = incoming.reduce(sumVinVout, 0);
            amount = new BigNumber(myInputsSum).minus(totalSpent).minus(fee ?? '0');
        }
    }

    const tokens = accountAddress
        ? filterTokenTransfers(accountAddress, blockfrostTxData, type)
        : [];

    return {
        type,
        txid: blockfrostTxData.txHash,
        blockTime: blockfrostTxData.txData.block_time,
        blockHeight: blockfrostTxData.txData.block_height || undefined,
        blockHash: blockfrostTxData.txData.block,
        amount: amount?.toString(),
        fee,
        targets: targets.map(t => transformTarget(t, incoming)),
        tokens,
        internalTransfers: [],
        cardanoSpecific: {
            subtype: getSubtype(blockfrostTxData),
            withdrawal,
            deposit,
        },
        feeRate: undefined,
        details: {
            vin: inputs.map(enhanceVinVout(myAddresses)),
            vout: outputs.map(enhanceVinVout(myAddresses)),
            size: blockfrostTxData.txData.size,
            totalInput: totalInput.toString(),
            totalOutput: totalOutput.toString(),
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
                      transformTransaction(info.descriptor, info.addresses, tx),
                  ),
        },
    };

    return result;
};
