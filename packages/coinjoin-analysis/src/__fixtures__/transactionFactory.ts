import { analyze } from '../blockchainAnalyzer';
import { type AnalysisCoin, AnalysisPubKey, AnalysisTransaction, ScriptType } from '../transaction';

/**
 * Port of the pieces of `WalletWasabi.Tests/Helpers/BitcoinFactory.cs` and
 * `WalletWasabi.Tests/Helpers/AnalyzedTransaction/*` that the `BlockchainAnalysis`
 * suites drive `BlockchainAnalyzer.Analyze` through.
 *
 * Both factories build P2WPKH scripts, as upstream's do — note that this differs from
 * the `get-anonymity-scores` request path, where internal outputs are taproot.
 */

let counter = 0;
const nextId = () => {
    counter += 1;

    return counter.toString(16).padStart(8, '0');
};

/** A distinct P2WPKH scriptPubKey per call. */
export const createScript = () => `0014${nextId().repeat(5)}`;

export const createPubKey = () => new AnalysisPubKey(`key-${nextId()}`);

const createTransaction = () => {
    const tx = new AnalysisTransaction();
    tx.id = `tx-${nextId()}`;

    return tx;
};

/**
 * `BitcoinFactory.CreateSmartCoin` — a coin on a fresh single-output previous
 * transaction, with its anonymity set recorded against that previous transaction.
 */
export const createSmartCoin = (
    pubKey: AnalysisPubKey,
    amount: number,
    anonymitySet: number,
): AnalysisCoin => {
    const previous = createTransaction();
    previous.outputCount = 1;
    const coin: AnalysisCoin = {
        transaction: previous,
        outpoint: `${previous.id}:0`,
        amount,
        scriptType: ScriptType.P2WPKH,
        pubKey,
    };
    previous.walletOutputs.push(coin);
    pubKey.setAnonymitySet(anonymitySet, previous.id);

    return coin;
};

export interface OwnCoinSpec {
    value: number;
    anonset: number;
    pubKey?: AnalysisPubKey;
}

export interface ForeignOutputSpec {
    value: number;
    /** Share a script with another output to model reuse by another participant. */
    scriptPubKey?: string;
}

/**
 * `BitcoinFactory.CreateSmartTransaction`.
 *
 * Input order: when `orderByAmount` is set, own inputs larger than the sum of the others'
 * outputs come first (they are known to be the largest), then the foreign inputs, then
 * the rest of the own inputs. Output order: the others' outputs then the own ones, sorted
 * by descending value when `orderByAmount` is set.
 */
export const createSmartTransaction = ({
    othersInputCount = 1,
    othersOutputs = [],
    ownInputs = [],
    ownOutputs = [],
    orderByAmount = false,
}: {
    othersInputCount?: number;
    othersOutputs?: ForeignOutputSpec[];
    ownInputs?: OwnCoinSpec[];
    ownOutputs?: OwnCoinSpec[];
    orderByAmount?: boolean;
}): AnalysisTransaction => {
    const tx = createTransaction();

    const othersOutputSum = othersOutputs.reduce((total, output) => total + output.value, 0);
    let remainingOwnInputs = [...ownInputs];
    if (orderByAmount) {
        remainingOwnInputs = stableSortDescending(ownInputs, x => x.value);
        let leading = 0;
        for (const input of remainingOwnInputs) {
            if (input.value > othersOutputSum) {
                addOwnInput(tx, input);
                leading += 1;
            } else {
                break;
            }
        }
        remainingOwnInputs = remainingOwnInputs.slice(leading);
    }

    for (let i = 0; i < othersInputCount; i++) {
        tx.inputs.push({ outpoint: `foreign-${nextId()}:0` });
        tx.foreignInputCount += 1;
    }

    remainingOwnInputs.forEach(input => addOwnInput(tx, input));

    const outputs: { value: number; own?: OwnCoinSpec; scriptPubKey?: string }[] = [
        ...othersOutputs.map(output => ({
            value: output.value,
            scriptPubKey: output.scriptPubKey,
        })),
        ...ownOutputs.map(output => ({ value: output.value, own: output })),
    ];
    const ordered = orderByAmount ? stableSortDescending(outputs, x => x.value) : outputs;

    ordered.forEach(output => {
        const index = tx.outputCount;
        tx.outputCount += 1;
        if (output.own !== undefined) {
            // `BitcoinFactory.CreateSmartTransaction` carries an anonset on each own
            // output but never applies it: the key keeps whatever anonymity it already
            // has, which is the default for a fresh key, the input's value when the key
            // is shared with an input, and whatever a test set explicitly. The upstream
            // suites pass `HdPubKey.DefaultHighAnonymitySet` there as documentation only.
            const pubKey = output.own.pubKey ?? createPubKey();
            tx.walletOutputs.push({
                transaction: tx,
                outpoint: `${tx.id}:${index}`,
                amount: output.value,
                scriptType: ScriptType.P2WPKH,
                pubKey,
            });
        } else {
            tx.foreignOutputs.push({
                amount: output.value,
                scriptPubKey: output.scriptPubKey ?? createScript(),
                index,
            });
        }
    });

    return tx;
};

const addOwnInput = (tx: AnalysisTransaction, input: OwnCoinSpec) => {
    const coin = createSmartCoin(input.pubKey ?? createPubKey(), input.value, input.anonset);
    tx.inputs.push({ outpoint: coin.outpoint, coin });
    tx.walletInputs.push(coin);
};

const stableSortDescending = <T>(source: readonly T[], key: (item: T) => number): T[] =>
    source
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
            const left = key(a.item);
            const right = key(b.item);
            if (left === right) {
                return a.index - b.index;
            }

            return left > right ? -1 : 1;
        })
        .map(x => x.item);

/**
 * `WalletWasabi.Tests/Helpers/AnalyzedTransaction/AnalyzedTransaction.cs`.
 *
 * Builds a graph of transactions so that `ComputeInputSanction`'s recursion into input
 * history can be exercised, and analyzes it in topological order.
 */
export class AnalyzedTransactionBuilder {
    readonly tx = createTransaction();

    addForeignInput(source?: { amount: number; outpoint: string }) {
        const outpoint = source?.outpoint ?? `foreign-${nextId()}:0`;
        this.tx.inputs.push({ outpoint });
        this.tx.foreignInputCount += 1;

        return { amount: source?.amount ?? 100_000_000, outpoint };
    }

    /** `AddWalletInput(WalletOutput)`. */
    addWalletInputCoin(coin: AnalysisCoin) {
        this.tx.inputs.push({ outpoint: coin.outpoint, coin });
        this.tx.walletInputs.push(coin);

        return coin;
    }

    /**
     * `AddWalletInput(decimal, string?, int anonymity)`.
     *
     * Synthesizes a source coinjoin with `anonymity - 1` foreign inputs and outputs so
     * that the input genuinely carries that anonymity once the graph is analyzed.
     */
    addWalletInput(amount = 100_000_000, anonymity = 1) {
        const source = new AnalyzedTransactionBuilder();
        for (let i = 0; i < anonymity - 1; i++) {
            source.addForeignInput();
        }
        for (let i = 0; i < anonymity - 1; i++) {
            source.addForeignOutput();
        }
        source.addWalletInputCoin(createFreshCoin(amount));
        const walletOutput = source.addWalletOutput(amount);

        return this.addWalletInputCoin(walletOutput);
    }

    addForeignOutput(amount = 100_000_000, scriptType: ScriptType = ScriptType.P2WPKH) {
        const index = this.tx.outputCount;
        this.tx.outputCount += 1;
        const scriptPubKey =
            scriptType === ScriptType.P2WPKH ? createScript() : `76a914${nextId().repeat(5)}88ac`;
        this.tx.foreignOutputs.push({ amount, scriptPubKey, index });

        return { amount, outpoint: `${this.tx.id}:${index}` };
    }

    addWalletOutput(amount = 100_000_000): AnalysisCoin {
        const index = this.tx.outputCount;
        this.tx.outputCount += 1;
        const coin: AnalysisCoin = {
            transaction: this.tx,
            outpoint: `${this.tx.id}:${index}`,
            amount,
            scriptType: ScriptType.P2WPKH,
            pubKey: createPubKey(),
        };
        this.tx.walletOutputs.push(coin);

        return coin;
    }

    /** `AnalyzeRecursively` — analyze inputs' transactions first, then this one. */
    analyzeRecursively() {
        const analyzed = new Set<AnalysisTransaction>();
        const helper = (transaction: AnalysisTransaction) => {
            if (analyzed.has(transaction)) {
                return;
            }
            analyzed.add(transaction);
            transaction.walletInputs.forEach(input => helper(input.transaction));
            analyze(transaction);
        };
        helper(this.tx);
    }
}

/** `WalletOutput.Create` — a coin on a transaction with no inputs. */
const createFreshCoin = (amount: number): AnalysisCoin => {
    const transaction = createTransaction();
    transaction.outputCount = 1;
    const coin: AnalysisCoin = {
        transaction,
        outpoint: `${transaction.id}:0`,
        amount,
        scriptType: ScriptType.P2WPKH,
        pubKey: createPubKey(),
    };
    transaction.walletOutputs.push(coin);

    return coin;
};
