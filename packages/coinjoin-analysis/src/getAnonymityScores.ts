import { analyze } from './blockchainAnalyzer';
import { type AnalysisCoin, AnalysisPubKey, AnalysisTransaction, ScriptType } from './transaction';

/**
 * Port of
 * `WalletWasabi.WabiSabiClientLibrary/Controllers/Helpers/GetAnonymityScoresHelper.cs`,
 * i.e. the former `get-anonymity-scores` endpoint.
 */

/** `Models/GetAnonymityScores/InternalInput.cs` and `InternalOutput.cs`. */
export interface AnalyzeInternalVinVout {
    Address: string;
    Value: number;
}

/**
 * `Models/GetAnonymityScores/ExternalOutput.cs`.
 *
 * `ExternalInput` upstream is `record ExternalInput()` — a record with **no fields**. The
 * request carries a `ScriptPubKey` and a `Value` for external inputs anyway and the
 * deserializer discards both, so an external input contributes only to the input count,
 * never its value. That is reproduced here by only counting them.
 */
export interface AnalyzeExternalVinVout {
    ScriptPubKey: string;
    Value: number;
}

export interface AnalyzeTransactionDetails {
    InternalInputs: AnalyzeInternalVinVout[];
    InternalOutputs: AnalyzeInternalVinVout[];
    ExternalInputs: AnalyzeExternalVinVout[];
    ExternalOutputs: AnalyzeExternalVinVout[];
}

/** `Models/GetAnonymityScores/AddressAnonymity.cs`. */
export interface AddressAnonymity {
    Address: string;
    AnonymitySet: number;
}

/**
 * `GetAnonymityScoresHelper.TransactionLabelProvider`.
 *
 * One `AnalysisPubKey` per address, shared across every transaction in the request. It is
 * what turns the whole analysis into a fold over mutable per-address state, and it is
 * also the enumeration order of the result: a `Dictionary`, so insertion ordered.
 */
class PubKeyProvider {
    private readonly byAddress = new Map<string, AnalysisPubKey>();

    exists(address: string) {
        return this.byAddress.has(address);
    }

    get(address: string) {
        let pubKey = this.byAddress.get(address);
        if (pubKey === undefined) {
            pubKey = new AnalysisPubKey(address);
            this.byAddress.set(address, pubKey);
        }

        return pubKey;
    }

    getAnonymitySets(): AddressAnonymity[] {
        return [...this.byAddress.values()].map(pubKey => ({
            Address: pubKey.address,
            AnonymitySet: pubKey.anonymitySet,
        }));
    }
}

/**
 * `AnalyzedTransaction.FromTransaction`.
 *
 * The order the pieces are added in matters twice over: it fixes the transaction's input
 * and output order (the wallet's first in both), which
 * `CalculateHalfMixedAnonScore` walks, and it fixes the order the synthetic outpoint
 * counter is consumed in, which feeds the transaction's identity.
 */
const buildAnalysisTransaction = (
    transaction: AnalyzeTransactionDetails,
    pubKeys: PubKeyProvider,
): AnalysisTransaction => {
    const tx = new AnalysisTransaction();

    // `OutPointGenerator` — a counter that starts at zero for **every** transaction. Two
    // request transactions with the same shape and values therefore get the same
    // synthetic hash upstream, which is what the "already processed this transaction"
    // branch of `AnalyzeCoinjoinWalletOutputs` keys off. The identity below is built from
    // the same content so that it collides in exactly the same cases.
    let outPointCounter = 0;
    const generateOutPoint = () => `${outPointCounter++}:0`;

    const identityParts: string[] = [];

    transaction.InternalInputs.forEach(internalInput => {
        if (!pubKeys.exists(internalInput.Address)) {
            throw new Error(
                'There is an internal input that references a non-existing transaction.',
            );
        }
        const pubKey = pubKeys.get(internalInput.Address);

        // `AddInternalInput` builds a one-input, one-output previous transaction, so the
        // coin's outpoint is a function of the counter value, the amount and the address.
        const previousOutPoint = generateOutPoint();
        const previous = new AnalysisTransaction();
        previous.id = `prev(${previousOutPoint},${internalInput.Value},${internalInput.Address})`;
        previous.outputCount = 1;
        const coin: AnalysisCoin = {
            transaction: previous,
            outpoint: `${previous.id}:0`,
            amount: internalInput.Value,
            scriptType: ScriptType.Taproot,
            pubKey,
        };
        previous.walletOutputs.push(coin);

        tx.inputs.push({ outpoint: coin.outpoint, coin });
        tx.walletInputs.push(coin);
        identityParts.push(`i:${coin.outpoint}`);
    });

    transaction.ExternalInputs.forEach(() => {
        const outpoint = generateOutPoint();
        tx.inputs.push({ outpoint });
        tx.foreignInputCount += 1;
        identityParts.push(`i:${outpoint}`);
    });

    transaction.InternalOutputs.forEach(internalOutput => {
        const pubKey = pubKeys.get(internalOutput.Address);
        const index = tx.outputCount;
        tx.outputCount += 1;
        tx.walletOutputs.push({
            transaction: tx,
            // Filled in once the identity is known, see below.
            outpoint: `${index}`,
            amount: internalOutput.Value,
            scriptType: ScriptType.Taproot,
            pubKey,
        });
        identityParts.push(`o:${internalOutput.Value}:taproot(${internalOutput.Address})`);
    });

    transaction.ExternalOutputs.forEach(externalOutput => {
        const index = tx.outputCount;
        tx.outputCount += 1;
        tx.foreignOutputs.push({
            amount: externalOutput.Value,
            scriptPubKey: externalOutput.ScriptPubKey,
            index,
        });
        identityParts.push(`o:${externalOutput.Value}:${externalOutput.ScriptPubKey}`);
    });

    tx.id = identityParts.join('|');
    tx.walletOutputs.forEach(coin => {
        coin.outpoint = `${tx.id}:${coin.outpoint}`;
    });

    return tx;
};

/**
 * `get-anonymity-scores`.
 *
 * Suite sends transactions newest first; the binary iterates
 * `request.Transactions.Reverse()`, so the fold runs oldest first. Each address's score
 * is recorded the first time it appears, right after the transaction that introduced it
 * — `AddressAnonymityCollection.Add` is first-write-wins, so later updates to the same
 * address are not reflected in the result.
 */
export const getAnonymityScores = (
    transactions: readonly AnalyzeTransactionDetails[],
): AddressAnonymity[] => {
    const pubKeys = new PubKeyProvider();
    const addresses = new Set<string>();
    const results: AddressAnonymity[] = [];

    [...transactions].reverse().forEach(transaction => {
        analyze(buildAnalysisTransaction(transaction, pubKeys));

        pubKeys.getAnonymitySets().forEach(addressAnonymity => {
            if (!addresses.has(addressAnonymity.Address)) {
                addresses.add(addressAnonymity.Address);
                results.push(addressAnonymity);
            }
        });
    });

    return results;
};
