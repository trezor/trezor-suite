import { DEFAULT_HIGH_ANONYMITY_SET, isStdDenom } from './constants';

/**
 * The `SmartTransaction` / `SmartCoin` / `HdPubKey` shape the analyzer needs, as
 * `WalletWasabi.WabiSabiClientLibrary/Controllers/Helpers/GetAnonymityScoresHelper.cs`
 * builds it.
 *
 * The helper fabricates a `SmartTransaction` per request transaction: internal inputs
 * become wallet coins on a synthetic previous transaction, external inputs become bare
 * outpoints from a counter that **restarts at zero for every transaction**, internal
 * outputs get a taproot script derived from the address's dummy key, and external outputs
 * keep the scriptPubKey they were sent with.
 */

/** `NBitcoin.ScriptType`, zero-based in declaration order as the enum has no values. */
export enum ScriptType {
    Witness = 0,
    P2PKH = 1,
    P2SH = 2,
    P2PK = 3,
    P2WPKH = 4,
    P2WSH = 5,
    MultiSig = 6,
    Taproot = 7,
}

/**
 * `HdPubKey` reduced to what `BlockchainAnalyzer` reads and writes.
 *
 * One instance per address, shared across every transaction in a request, which is what
 * makes the whole analysis a fold over mutable per-address state.
 */
export class AnalysisPubKey {
    /** `HdPubKey.AnonymitySet`. */
    anonymitySet = DEFAULT_HIGH_ANONYMITY_SET;

    /** `HdPubKey.OutputAnonSetReasons` — the synthetic transaction identities. */
    readonly outputAnonSetReasons = new Set<string>();

    constructor(readonly address: string) {}

    /** `HdPubKey.SetAnonymitySet`. */
    setAnonymitySet(anonset: number, outputAnonSetReason?: string) {
        if (outputAnonSetReason !== undefined) {
            this.outputAnonSetReasons.add(outputAnonSetReason);
        }
        this.anonymitySet = anonset;
    }
}

/** `SmartCoin`, reduced the same way. */
export interface AnalysisCoin {
    /** Which transaction this coin is an output of. */
    transaction: AnalysisTransaction;
    /** The outpoint, as an opaque identity. */
    outpoint: string;
    amount: number;
    scriptType: ScriptType;
    pubKey: AnalysisPubKey;
}

/** `WalletVirtualInput` / `WalletVirtualOutput` — wallet coins grouped by pubkey hash. */
export interface WalletVirtualCoin {
    pubKey: AnalysisPubKey;
    amount: number;
    coins: AnalysisCoin[];
}

/** `ForeignVirtualOutput` — foreign outputs grouped by extracted key id. */
export interface ForeignVirtualOutput {
    amount: number;
    outpoints: Set<string>;
    scriptType: ScriptType;
}

export interface AnalysisTransactionInput {
    /** The outpoint the transaction spends. */
    outpoint: string;
    /** Set when the input belongs to the wallet. */
    coin?: AnalysisCoin;
}

/** `SmartTransaction`, reduced to what `BlockchainAnalyzer` and `CoinjoinAnalyzer` read. */
export class AnalysisTransaction {
    /**
     * The synthetic transaction identity, standing in for `SmartTransaction.GetHash()`.
     *
     * Used only as a key in `HdPubKey.OutputAnonSetReasons`, so any injective function of
     * the same content works. It has to be a function of the *content* rather than of the
     * object, because the helper's outpoint counter restarts per transaction: two request
     * transactions with the same shape and values produce the same synthetic hash
     * upstream, and the address-reuse branch of `AnalyzeCoinjoinWalletOutputs` depends on
     * that. See `buildAnalysisTransaction`.
     */
    id = '';

    /** Inputs in transaction order: the wallet's first, then the foreign ones. */
    readonly inputs: AnalysisTransactionInput[] = [];
    readonly walletInputs: AnalysisCoin[] = [];
    readonly walletOutputs: AnalysisCoin[] = [];
    readonly foreignOutputs: { amount: number; scriptPubKey: string; index: number }[] = [];
    /** Only the count matters: `ExternalInput` upstream is a record with no fields. */
    foreignInputCount = 0;
    /** `SmartTransaction.Transaction.Outputs.Count`. */
    outputCount = 0;

    private walletVirtualInputsCache?: WalletVirtualCoin[];
    private walletVirtualOutputsCache?: WalletVirtualCoin[];
    private foreignVirtualOutputsCache?: ForeignVirtualOutput[];

    /** `SmartTransaction.WalletVirtualInputs` — grouped by pubkey, insertion ordered. */
    get walletVirtualInputs(): WalletVirtualCoin[] {
        this.walletVirtualInputsCache ??= groupByPubKey(this.walletInputs);

        return this.walletVirtualInputsCache;
    }

    /** `SmartTransaction.WalletVirtualOutputs`. */
    get walletVirtualOutputs(): WalletVirtualCoin[] {
        this.walletVirtualOutputsCache ??= groupByPubKey(this.walletOutputs);

        return this.walletVirtualOutputsCache;
    }

    /**
     * `SmartTransaction.ForeignVirtualOutputs` — grouped by `ExtractKeyId()`, which is the
     * pubkey hash for P2WPKH, P2PKH and P2PK and the whole script otherwise.
     */
    get foreignVirtualOutputs(): ForeignVirtualOutput[] {
        if (this.foreignVirtualOutputsCache === undefined) {
            const groups = new Map<string, ForeignVirtualOutput>();
            this.foreignOutputs.forEach(output => {
                const key = extractKeyId(output.scriptPubKey);
                const existing = groups.get(key);
                if (existing === undefined) {
                    groups.set(key, {
                        amount: output.amount,
                        outpoints: new Set([`${this.id}:${output.index}`]),
                        scriptType: tryGetScriptType(output.scriptPubKey) ?? ScriptType.P2WPKH,
                    });
                } else {
                    existing.amount += output.amount;
                    existing.outpoints.add(`${this.id}:${output.index}`);
                }
            });
            this.foreignVirtualOutputsCache = [...groups.values()];
        }

        return this.foreignVirtualOutputsCache;
    }

    /**
     * `SmartTransaction.IsWasabi2Cj`.
     *
     * At least two outputs, at least fifty inputs (the minimum input count at the
     * beginning of Wasabi 2), and more than 80% of the outputs on a standard denomination.
     */
    get isWasabi2Cj(): boolean {
        const outputValues = [
            ...this.walletOutputs.map(x => x.amount),
            ...this.foreignOutputs.map(x => x.amount),
        ];

        return (
            this.outputCount >= 2 &&
            this.inputs.length >= 50 &&
            outputValues.filter(isStdDenom).length > outputValues.length * 0.8
        );
    }
}

const groupByPubKey = (coins: readonly AnalysisCoin[]): WalletVirtualCoin[] => {
    const groups = new Map<AnalysisPubKey, WalletVirtualCoin>();
    coins.forEach(coin => {
        const existing = groups.get(coin.pubKey);
        if (existing === undefined) {
            groups.set(coin.pubKey, {
                pubKey: coin.pubKey,
                amount: coin.amount,
                coins: [coin],
            });
        } else {
            existing.amount += coin.amount;
            existing.coins.push(coin);
        }
    });

    return [...groups.values()];
};

/** `NBitcoinExtensions.TryGetScriptType` — probed in upstream's order. */
export const tryGetScriptType = (scriptPubKeyHex: string): ScriptType | undefined => {
    const hex = scriptPubKeyHex.toLowerCase();
    if (/^0014[0-9a-f]{40}$/.test(hex)) {
        return ScriptType.P2WPKH;
    }
    if (/^76a914[0-9a-f]{40}88ac$/.test(hex)) {
        return ScriptType.P2PKH;
    }
    if (/^(21[0-9a-f]{66}|41[0-9a-f]{130})ac$/.test(hex)) {
        return ScriptType.P2PK;
    }
    if (/^5120[0-9a-f]{64}$/.test(hex)) {
        return ScriptType.Taproot;
    }

    return undefined;
};

/** `NBitcoinExtensions.ExtractKeyId`. */
export const extractKeyId = (scriptPubKeyHex: string): string => {
    const hex = scriptPubKeyHex.toLowerCase();
    switch (tryGetScriptType(hex)) {
        case ScriptType.P2WPKH:
            return hex.slice(4);
        case ScriptType.P2PKH:
            return hex.slice(6, 46);
        case ScriptType.P2PK:
            return hex.slice(2, hex.length - 2);
        default:
            return hex;
    }
};
