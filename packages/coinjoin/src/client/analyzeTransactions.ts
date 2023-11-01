import { address as addressBjs, Network } from '@trezor/utxo-lib';
import { arrayPartition } from '@trezor/utils';

import * as middleware from './middleware';
import { Transaction, EnhancedVinVout } from '../types/backend';
import { AnalyzeInternalVinVout, AnalyzeExternalVinVout } from '../types/middleware';
import type { CoinjoinClient } from './CoinjoinClient';

interface AnalyzeTransactionsOptions {
    network: Network;
    middlewareUrl: string;
    logger: CoinjoinClient['logger'];
    signal: AbortSignal;
}

export interface AnalyzeTransactionsResult {
    anonymityScores: Record<string, number> | undefined;
    rawLiquidityClue: middleware.RawLiquidityClue;
}

const transformVinVout = (vinvout: EnhancedVinVout, network: Network) => {
    if (!vinvout.isAddress || !vinvout.addresses || vinvout.addresses.length > 1) return [];

    const Address = vinvout.addresses[0];
    const Value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { Address, Value } as AnalyzeInternalVinVout;

    const ScriptPubKey = addressBjs.toOutputScript(Address, network).toString('hex');
    return {
        ScriptPubKey,
        Value,
    } as AnalyzeExternalVinVout;
};

const isInternal = (
    vinvout: AnalyzeInternalVinVout | AnalyzeExternalVinVout,
): vinvout is AnalyzeInternalVinVout => 'Address' in vinvout;

export const getRawLiquidityClue = (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
): Promise<middleware.RawLiquidityClue> => {
    // find most recent coinjoin transaction in history
    const cjTx = transactions.find(tx => tx.type === 'joint');
    if (!cjTx) return Promise.resolve(null);
    const externalAmounts = cjTx.details.vout
        .flatMap(vout => transformVinVout(vout, options.network))
        .filter(vout => !('address' in vout))
        .map(o => Number(o.Value));
    return middleware.initLiquidityClue(externalAmounts, {
        baseUrl: options.middlewareUrl,
        signal: options.signal,
    });
};

/**
 * Get transactions from CoinjoinBackend.getAccountInfo and calculate anonymity in middleware.
 * Returns { key => value } where `key` is an address and `value` is an anonymity level of that address
 */
export const getAnonymityScores = async (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    const formattedTransactions = transactions.map(tx => {
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

    try {
        const scores = await middleware.getAnonymityScores(formattedTransactions, {
            baseUrl: options.middlewareUrl,
            signal: options.signal,
        });

        return scores.reduce(
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

export const analyzeTransactions = async <T extends keyof AnalyzeTransactionsResult>(
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
    sections?: T[],
): Promise<{ [P in T]: AnalyzeTransactionsResult[P] }> =>
    ({
        anonymityScores:
            !sections || sections.includes('anonymityScores' as T)
                ? await getAnonymityScores(transactions, options)
                : undefined,
        rawLiquidityClue:
            !sections || sections.includes('rawLiquidityClue' as T)
                ? await getRawLiquidityClue(transactions, options)
                : undefined,
    }) as AnalyzeTransactionsResult;
