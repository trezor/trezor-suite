import {
    type AnalyzeExternalVinVout,
    type AnalyzeInternalVinVout,
    type AnalyzeTransactionDetails,
    type RawLiquidityClue,
    getAnonymityScores as computeAnonymityScores,
    initLiquidityClue,
} from '@trezor/coinjoin-analysis';
import type { Logger } from '@trezor/logger';
import { arrayPartition } from '@trezor/utils';
import { type Network, address as addressBjs } from '@trezor/utxo-lib';

import { type EnhancedVinVout, type Transaction } from '../types/backend';

interface AnalyzeTransactionsOptions {
    network: Network;
    logger: Logger;
}

export interface AnalyzeTransactionsResult {
    anonymityScores: Record<string, number> | undefined;
    rawLiquidityClue: RawLiquidityClue;
}

/**
 * Turns a backend transaction's inputs and outputs into the shape the ported analyzer
 * takes. This pass stays here rather than moving into `@trezor/coinjoin-analysis`,
 * because it needs `@trezor/utxo-lib` to derive the scriptPubKey of a foreign address,
 * and that package is deliberately dependency-free.
 */
const transformVinVout = (vinvout: EnhancedVinVout, network: Network) => {
    if (!vinvout.isAddress || !vinvout.addresses || vinvout.addresses.length > 1) return [];

    const { addresses } = vinvout;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const Address: string = addresses[0];
    const Value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { Address, Value };

    const ScriptPubKey = addressBjs.toOutputScript(Address, network).toString('hex');

    return {
        ScriptPubKey,
        Value,
    };
};

const isInternal = (
    vinvout: AnalyzeInternalVinVout | AnalyzeExternalVinVout,
): vinvout is AnalyzeInternalVinVout => 'Address' in vinvout;

const getRawLiquidityClue = (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
): RawLiquidityClue => {
    // find most recent coinjoin transaction in history
    const cjTx = transactions.find(tx => tx.type === 'joint');
    if (!cjTx) return null;
    const externalAmounts = cjTx.details.vout
        .flatMap(vout => transformVinVout(vout, options.network))
        .filter(vout => !('address' in vout))
        .map(o => Number(o.Value));

    return initLiquidityClue(externalAmounts);
};

/**
 * The analyzer's input, as derived from a backend account's history.
 *
 * Exported so that `tools/anonymity-test.ts` can record exactly what was fed to the
 * analyzer; that tool used to capture it by intercepting the HTTP request to the
 * middleware.
 */
export const getAnonymityScoresRequest = (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
): AnalyzeTransactionDetails[] =>
    transactions.map(tx => {
        const [InternalInputs, ExternalInputs] = arrayPartition(
            tx.details.vin.flatMap(vin => transformVinVout(vin, options.network)),
            isInternal,
        );

        const [InternalOutputs, ExternalOutputs] = arrayPartition(
            tx.details.vout.flatMap(vout => transformVinVout(vout, options.network)),
            isInternal,
        );

        return {
            InternalInputs,
            ExternalInputs,
            InternalOutputs,
            ExternalOutputs,
        };
    });

/**
 * Get transactions from CoinjoinBackend.getAccountInfo and calculate anonymity scores.
 * Returns { key => value } where `key` is an address and `value` is an anonymity level of that address
 */
export const getAnonymityScores = (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    try {
        return computeAnonymityScores(getAnonymityScoresRequest(transactions, options)).reduce(
            (dict, { Address, AnonymitySet }) => {
                dict[Address] = AnonymitySet;

                return dict;
            },
            {} as Record<string, number>,
        );
    } catch (error) {
        options.logger.error(`Error calculating anonymity levels. ${error}`);
    }
};

export const analyzeTransactions = <T extends keyof AnalyzeTransactionsResult>(
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
    sections?: T[],
): { [P in T]: AnalyzeTransactionsResult[P] } =>
    ({
        anonymityScores:
            !sections || sections.includes('anonymityScores' as T)
                ? getAnonymityScores(transactions, options)
                : undefined,
        rawLiquidityClue:
            !sections || sections.includes('rawLiquidityClue' as T)
                ? getRawLiquidityClue(transactions, options)
                : undefined,
    }) as AnalyzeTransactionsResult;
