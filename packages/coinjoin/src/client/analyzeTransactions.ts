import { arrayPartition } from '@trezor/utils';
import { type Network, address as addressBjs } from '@trezor/utxo-lib';

import { getAnonymityScores as middlewareGetAnonymityScores } from './getAnonymityScores';
import * as middleware from './middleware';
import { type EnhancedVinVout, type Transaction } from '../types/backend';
import { type Logger } from '../types/logger';
import { type AnalyzeExternalVinVout, type AnalyzeInternalVinVout } from '../types/middleware';

interface AnalyzeTransactionsOptions {
    network: Network;
    middlewareUrl: string;
    logger: Logger;
    signal: AbortSignal;
}

export interface AnalyzeTransactionsResult {
    anonymityScores: Record<string, number> | undefined;
    rawLiquidityClue: middleware.RawLiquidityClue;
}

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

const transformVinVout2 = (vinvout: EnhancedVinVout, network: Network) => {
    if (!vinvout.isAddress || !vinvout.addresses || vinvout.addresses.length > 1) return [];

    const { addresses } = vinvout;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const address: string = addresses[0];
    const value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { address, value };

    const scriptPubKey = addressBjs.toOutputScript(address, network).toString('hex');

    return {
        scriptPubKey,
        value,
    };
};

const isInternal = (
    vinvout: AnalyzeInternalVinVout | AnalyzeExternalVinVout,
): vinvout is AnalyzeInternalVinVout => 'Address' in vinvout;

const getRawLiquidityClue = (
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

    const newScores: Record<string, number> = {};
    try {
        const formattedTransactions2 = transactions.map(tx => {
            const [internalInputs, externalInputs] = arrayPartition(
                tx.details.vin.flatMap(vin => transformVinVout2(vin, options.network)),
                (a: any) => 'address' in a,
            );

            const [internalOutputs, externalOutputs] = arrayPartition(
                tx.details.vout.flatMap(vout => transformVinVout2(vout, options.network)),
                (a: any) => 'address' in a,
            );

            return {
                internalInputs,
                externalInputs,
                internalOutputs,
                externalOutputs,
            };
        });
        middlewareGetAnonymityScores({
            transactions: formattedTransactions2,
        }).reduce((dict, { address, anonymitySet }) => {
            dict[address] = anonymitySet;

            return dict;
        }, newScores);
    } catch (error) {
        console.warn(`Error calculating NEW anonymity levels. ${error}`);
    }

    try {
        const scores = await middleware.getAnonymityScores(formattedTransactions, {
            baseUrl: options.middlewareUrl,
            signal: options.signal,
        });

        console.log(
            `Old anonymity scores: ${scores.length}, New anonymity scores: ${Object.keys(newScores).length}`,
        );

        let missed = 0;

        return scores.reduce(
            (dict, { Address, AnonymitySet }) => {
                dict[Address] = AnonymitySet;

                if (!newScores[Address]) {
                    console.warn(`Missing NEW anonymity score for ${Address}`);
                } else {
                    if (newScores[Address] !== AnonymitySet) {
                        missed++;
                        console.warn(
                            `${missed} Anonymity score mismatch for ${Address}: OLD=${AnonymitySet} (${Math.floor(AnonymitySet)}), NEW=${newScores[Address]} (${Math.floor(newScores[Address])})`,
                        );
                    }
                }

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
