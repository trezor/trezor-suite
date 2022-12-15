import { address as addressBjs, Network } from '@trezor/utxo-lib';
import { arrayPartition } from '@trezor/utils';

import * as middleware from './middleware';
import { Transaction, EnhancedVinVout } from '../types/backend';
import {
    AnalyzeTransactionDetails,
    AnalyzeInternalVinVout,
    AnalyzeExternalVinVout,
} from '../types/middleware';

interface AnalyzeTransactionsOptions {
    network: Network;
    middlewareUrl: string;
    signal: AbortSignal;
}

const transformVinVout = (vinvout: EnhancedVinVout, network: Network) => {
    if (!vinvout.addresses || vinvout.addresses.length > 1) {
        throw new Error(`Unsupported address ${vinvout.addresses?.join('')}`);
    }
    const address = vinvout.addresses[0];
    const value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { address, value } as AnalyzeInternalVinVout;

    const scriptPubKey = addressBjs.toOutputScript(address, network).toString('hex');
    return {
        scriptPubKey,
        value,
    } as AnalyzeExternalVinVout;
};

/**
 * Get transactions from CoinjoinBackend.getAccountInfo and calculate anonymity in middleware.
 * Returns { key => value } where `key` is an address and `value` is an anonymity level of that address
 */
export const analyzeTransactions = async (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    const params = transactions.map(tx => {
        const [internalInputs, externalInputs] = arrayPartition(
            tx.details.vin.map(vin => transformVinVout(vin, options.network)),
            vin => 'address' in vin,
        );

        const [internalOutputs, externalOutputs] = arrayPartition(
            tx.details.vout.map(vout => transformVinVout(vout, options.network)),
            vout => 'address' in vout,
        );

        return {
            internalInputs,
            externalInputs,
            internalOutputs,
            externalOutputs,
        } as AnalyzeTransactionDetails;
    });

    const scores = await middleware.getAnonymityScores(params, {
        baseUrl: options.middlewareUrl,
        signal: options.signal,
    });

    // find most recent coinjoin transaction in history
    const cjTx = transactions.find(tx => tx.type === 'joint');
    let rawLiquidityClue: middleware.RawLiquidityClue = null;
    if (cjTx) {
        const externalAmounts = cjTx.details.vout
            .map(vout => transformVinVout(vout, options.network))
            .filter(vout => !('address' in vout))
            .map(o => Number(o.value));
        rawLiquidityClue = await middleware.initLiquidityClue(externalAmounts, {
            baseUrl: options.middlewareUrl,
            signal: options.signal,
        });
    }

    const anonymityScores = scores.reduce((dict, { address, anonymitySet }) => {
        dict[address] = anonymitySet;
        return dict;
    }, {} as Record<string, number>);

    return {
        anonymityScores,
        rawLiquidityClue,
    };
};
