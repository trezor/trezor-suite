import BigNumber from 'bignumber.js';
import {
    CoinjoinStatusEvent,
    RegisterAccountParams,
    CoinjoinTransactionData,
} from '@trezor/coinjoin';
import { getUtxoOutpoint, getBip43Type } from '@suite-common/wallet-utils';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';

export type CoinjoinBalanceBreakdown = {
    notAnonymized: string;
    anonymizing: string;
    anonymized: string;
};

/**
 * Breaks down account balance based on anonymity status
 */
export const breakdownCoinjoinBalance = ({
    targetAnonymity,
    anonymitySet,
    utxos,
    registeredUtxos,
}: {
    targetAnonymity: number | undefined;
    anonymitySet: Record<string, number | undefined> | undefined;
    utxos: Account['utxo'];
    registeredUtxos?: string[];
}): CoinjoinBalanceBreakdown => {
    const balanceBreakdown = {
        notAnonymized: '0',
        anonymizing: '0',
        anonymized: '0',
    };

    if (!anonymitySet || targetAnonymity === undefined || !utxos) {
        return balanceBreakdown;
    }

    utxos?.forEach(({ address, amount, txid, vout }) => {
        const outpoint = getUtxoOutpoint({ txid, vout });
        const bigAmount = new BigNumber(amount);
        const { notAnonymized, anonymizing, anonymized } = balanceBreakdown;

        if (registeredUtxos?.includes(outpoint)) {
            const newAnonymizing = new BigNumber(anonymizing).plus(bigAmount);

            balanceBreakdown.anonymizing = newAnonymizing.toString();
        } else if ((anonymitySet[address] || 0) < targetAnonymity) {
            const newNotAnonymized = new BigNumber(notAnonymized).plus(bigAmount);

            balanceBreakdown.notAnonymized = newNotAnonymized.toString();
        } else if ((anonymitySet[address] || 0) >= targetAnonymity) {
            const newAnonymized = new BigNumber(anonymized).plus(bigAmount);

            balanceBreakdown.anonymized = newAnonymized.toString();
        }
    });

    return balanceBreakdown;
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientFeeRatesMedians`
 * array => object { name: value-in-vBytes }
 */
export const transformFeeRatesMedians = (medians: CoinjoinStatusEvent['feeRatesMedians']) => {
    const [fast, recommended, slow] = medians.map(m => m.medianFeeRate);
    // convert from kvBytes (kilo virtual bytes) to vBytes
    const kvB2vB = (v: number) => (v ? Math.round(v / 1000) : 1);
    return {
        fast: kvB2vB(fast) * 2, // NOTE: this calculation will be smarter once have enough data
        recommended: kvB2vB(recommended),
        slow: kvB2vB(slow),
    };
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientInstance`
 * - coordinatorFeeRate: multiplied by 10. representation of percentage value
 * - feeRatesMedians: array => object with values in vBytes
 */
export const transformCoinjoinStatus = (event: CoinjoinStatusEvent) => ({
    rounds: event.rounds.map(r => ({ id: r.id, phase: r.phase })),
    coordinatorFeeRate: event.coordinatorFeeRate * 10,
    feeRatesMedians: transformFeeRatesMedians(event.feeRatesMedians),
});

// convert suite account type to @trezor/coinjoin RegisterAccountParams scriptType
const getCoinjoinAccountScriptType = (path: string) => {
    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
        case 'slip25':
            return 'Taproot';
        case 'bip84':
            return 'P2WPKH';
        default:
            return 'P2WPKH';
    }
};

// use only confirmed utxos, map to @trezor/coinjoin RegisterAccountParams utxos
const getCoinjoinAccountUtxos = (utxos: Account['utxo'], anonymitySet: any = {}) =>
    utxos
        ?.filter(utxo => utxo.confirmations)
        .map(utxo => ({
            path: utxo.path,
            outpoint: getUtxoOutpoint(utxo),
            amount: Number(utxo.amount),
            anonymityLevel: anonymitySet[utxo.address] || 1,
        })) || [];

// select only addresses without tx history
const getCoinjoinAccountAddresses = (addresses: Account['addresses']) =>
    addresses?.change.filter(a => !a.transfers) || [];

/**
 * Transform from suite Account to @trezor/coinjoin RegisterAccountParams
 */
export const getRegisterAccountParams = (
    account: Account,
    params: CoinjoinSessionParameters,
): RegisterAccountParams => ({
    scriptType: getCoinjoinAccountScriptType(account.path),
    accountKey: account.key,
    targetAnonymity: params.targetAnonymity,
    maxRounds: params.maxRounds,
    skipRounds: params.skipRounds,
    maxFeePerKvbyte: params.maxFeePerKvbyte,
    maxCoordinatorFeeRate: params.maxCoordinatorFeeRate,
    utxos: getCoinjoinAccountUtxos(account.utxo, account.addresses?.anonymitySet),
    changeAddresses: getCoinjoinAccountAddresses(account.addresses),
});

/**
 * Transform @trezor/coinjoin CoinjoinRequestEvent.CoinjoinTransactionData to @trezor/connect signTransaction params
 * Params are profiled byt account since multiple account can participate in one CoinjoinRound
 */
export const prepareCoinjoinTransaction = (
    account: Account,
    transaction: CoinjoinTransactionData,
) => {
    const inputScriptType = account.accountType === 'normal' ? 'SPENDWITNESS' : 'SPENDTAPROOT';
    const outputScriptType = account.accountType === 'normal' ? 'PAYTOWITNESS' : 'PAYTOTAPROOT';
    const isInternalInput = (input: CoinjoinTransactionData['inputs'][0]) =>
        input.path && account.utxo?.find(u => getUtxoOutpoint(u) === input.outpoint);
    const isInternalOutput = (output: CoinjoinTransactionData['outputs'][0]) =>
        output.path && account.addresses?.change.find(a => a.address === output.address);

    const tx = {
        inputs: transaction.inputs.map(input => {
            if (isInternalInput(input)) {
                return {
                    script_type: inputScriptType,
                    address_n: input.path!,
                    prev_hash: input.hash,
                    prev_index: input.index,
                    amount: input.amount,
                };
            }

            return {
                address_n: undefined,
                script_type: 'EXTERNAL' as const,
                prev_hash: input.hash,
                prev_index: input.index,
                amount: input.amount,
                script_pubkey: input.scriptPubKey,
                ownership_proof: input.ownershipProof,
                commitment_data: input.commitmentData,
            };
        }),
        outputs: transaction.outputs.map(output => {
            if (isInternalOutput(output)) {
                return {
                    address_n: output.path! as any,
                    amount: output.amount,
                    script_type: outputScriptType,
                    payment_req_index: 0,
                };
            }
            return {
                address: output.address,
                amount: output.amount,
                script_type: 'PAYTOADDRESS' as const,
                payment_req_index: 0,
            };
        }),
    };
    const paymentRequest = {
        ...transaction.paymentRequest,
        amount: tx.outputs.reduce(
            (sum, output) => (typeof output.address === 'string' ? sum + output.amount : sum),
            0,
        ),
    };

    return {
        ...tx,
        paymentRequest,
    };
};
