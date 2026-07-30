/**
 * Ported from WalletWasabi.WabiSabiClientLibrary (GetAnonymityScoresHelper.GetAnonymityScores)
 *
 * Calculates anonymity scores for wallet addresses across a set of Bitcoin transactions.
 * Transactions are analyzed in reverse order (newest first), which propagates anonymity
 * information from coinjoins back to the coins that funded them.
 *
 * Note: All monetary values are in satoshis.
 * Note: An anonymitySet of Infinity means the address has never appeared as an output
 *       (only as an input with no prior history provided).
 * Note: Wallet outputs are assumed to use Taproot (P2TR) scripts, matching the C# implementation.
 *       Foreign outputs are matched by script type when computing anonymity contributions.
 */

// ─── request / response types ────────────────────────────────────────────────

export interface InternalInput {
    address: string;
    value: number; // satoshis
}

export interface InternalOutput {
    address: string;
    value: number; // satoshis
}

/** Foreign inputs carry no data; only their count matters for analysis. */
export type ExternalInput = Record<string, never>;

export interface ExternalOutput {
    value: number; // satoshis
    scriptPubKey: string; // hex-encoded scriptPubKey
}

export interface Tx {
    internalInputs: InternalInput[];
    internalOutputs: InternalOutput[];
    externalInputs: ExternalInput[];
    externalOutputs: ExternalOutput[];
}

export interface GetAnonymityScoresRequest {
    transactions: Tx[];
}

export interface AddressAnonymity {
    address: string;
    anonymitySet: number;
}

// ─── internal types ───────────────────────────────────────────────────────────

type ScriptType = 'taproot' | 'p2wpkh' | 'p2wsh' | 'p2pkh' | 'p2sh' | 'unknown';

interface WalletVirtualInput {
    address: string;
    totalAmount: number;
    anonSet: number;
}

interface WalletVirtualOutput {
    address: string;
    totalAmount: number;
}

interface ForeignVirtualOutput {
    scriptPubKey: string;
    totalAmount: number;
    scriptType: ScriptType;
}

// ─── standard denominations ───────────────────────────────────────────────────

/**
 * Standard Wasabi 2 coinjoin output denominations (satoshis).
 * Source: BlockchainAnalyzer.StdDenoms
 */
const STD_DENOMS = new Set<number>([
    5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049, 65536, 100000,
    118098, 131072, 177147, 200000, 262144, 354294, 500000, 524288, 531441, 1000000, 1048576,
    1062882, 1594323, 2000000, 2097152, 3188646, 4194304, 4782969, 5000000, 8388608, 9565938,
    10000000, 14348907, 16777216, 20000000, 28697814, 33554432, 43046721, 50000000, 67108864,
    86093442, 100000000, 129140163, 134217728, 200000000, 258280326, 268435456, 387420489,
    500000000, 536870912, 774840978, 1000000000, 1073741824, 1162261467, 2000000000, 2147483648,
    2324522934, 3486784401, 4294967296, 5000000000, 6973568802, 8589934592, 10000000000,
    10460353203, 17179869184, 20000000000, 20920706406, 31381059609, 34359738368, 50000000000,
    62762119218, 68719476736, 94143178827, 100000000000, 137438953472,
]);

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Estimate cluster anonymity after input consolidation, penalizing exponentially.
 * Source: BlockchainAnalyzer.Intersect
 */
const intersect = (anonsetList: number[]): number => {
    if (anonsetList.length === 0) return 1;
    // Map Infinity (unset) to a very large finite number so Math.min works correctly.
    const values = anonsetList.map(a => (isFinite(a) ? a : Number.MAX_SAFE_INTEGER));
    const smallest = Math.min(...values);
    const penalty = Math.pow(2, anonsetList.length - 1);

    return Math.max(1, smallest / Math.max(1, penalty));
};

/**
 * Amount-weighted mean of anonymity sets.
 * Source: LinqExtensions.WeightedMean used in CoinjoinAnalyzer
 */
const weightedMean = (virtualInputs: WalletVirtualInput[]): number => {
    const totalWeight = virtualInputs.reduce((s, v) => s + v.totalAmount, 0);
    if (totalWeight === 0) return 0;

    return (
        virtualInputs.reduce((s, v) => {
            const a = isFinite(v.anonSet) ? v.anonSet : Number.MAX_SAFE_INTEGER;

            return s + a * v.totalAmount;
        }, 0) / totalWeight
    );
};

/** Minimum anonymity set across virtual inputs. */
const minAnonSet = (virtualInputs: WalletVirtualInput[]): number => {
    if (virtualInputs.length === 0) return 0;

    return Math.min(
        ...virtualInputs.map(v => (isFinite(v.anonSet) ? v.anonSet : Number.MAX_SAFE_INTEGER)),
    );
};

/**
 * Detect P2TR (Taproot) script: OP_1 <32-byte key> = 0x5120 + 64 hex chars.
 * Wallet outputs in this model are always Taproot (TaprootBIP86).
 * Foreign outputs are matched by script type for the anonymity contribution calculation.
 */
const getScriptType = (scriptPubKeyHex: string): ScriptType => {
    if (!scriptPubKeyHex) return 'unknown';
    const h = scriptPubKeyHex.toLowerCase();
    if (h.startsWith('5120') && h.length === 68) return 'taproot'; // P2TR
    if (h.startsWith('0014') && h.length === 44) return 'p2wpkh'; // P2WPKH
    if (h.startsWith('0020') && h.length === 68) return 'p2wsh'; // P2WSH
    if (h.startsWith('76a914') && h.length === 50) return 'p2pkh'; // P2PKH
    if (h.startsWith('a914') && h.length === 46) return 'p2sh'; // P2SH

    return 'unknown';
};

/**
 * Wasabi 2 coinjoin detection heuristic.
 * Source: SmartTransaction._isWasabi2Cj lazy field
 */
const checkIsWasabi2Cj = (tx: Tx): boolean => {
    const totalInputCount = tx.internalInputs.length + tx.externalInputs.length;
    const totalOutputCount = tx.internalOutputs.length + tx.externalOutputs.length;
    if (totalOutputCount < 2 || totalInputCount < 50) return false;
    const allValues = [
        ...tx.internalOutputs.map(o => o.value),
        ...tx.externalOutputs.map(o => o.value),
    ];
    const stdDenomCount = allValues.filter(v => STD_DENOMS.has(v)).length;

    return stdDenomCount > totalOutputCount * 0.8;
};

// ─── virtual grouping ─────────────────────────────────────────────────────────

/**
 * Group wallet inputs by address (same address = same virtual input, amounts summed).
 * Source: SmartTransaction.WalletVirtualInputs (grouped by HdPubKey.PubKeyHash)
 */
const getWalletVirtualInputs = (
    internalInputs: InternalInput[],
    anonsets: Record<string, number>,
): WalletVirtualInput[] => {
    const map: Record<string, WalletVirtualInput> = {};
    for (const inp of internalInputs) {
        if (!map[inp.address]) {
            map[inp.address] = { address: inp.address, totalAmount: 0, anonSet: Infinity };
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        map[inp.address]!.totalAmount += inp.value;
    }

    return Object.values(map).map(v => ({
        ...v,
        anonSet: anonsets[v.address] ?? Infinity,
    }));
};

/**
 * Group wallet outputs by address (same address = same virtual output, amounts summed).
 * Source: SmartTransaction.WalletVirtualOutputs (grouped by HdPubKey.PubKeyHash)
 */
const getWalletVirtualOutputs = (internalOutputs: InternalOutput[]): WalletVirtualOutput[] => {
    const map: Record<string, WalletVirtualOutput> = {};
    for (const out of internalOutputs) {
        if (!map[out.address]) map[out.address] = { address: out.address, totalAmount: 0 };
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        map[out.address]!.totalAmount += out.value;
    }

    return Object.values(map);
};

/**
 * Group foreign outputs by scriptPubKey (same script = same virtual output, amounts summed).
 * Source: SmartTransaction.ForeignVirtualOutputs (grouped by ScriptPubKey.ExtractKeyId())
 * Approximation: we group by full scriptPubKey hex rather than extracted key bytes.
 */
const getForeignVirtualOutputs = (externalOutputs: ExternalOutput[]): ForeignVirtualOutput[] => {
    const map: Record<string, ForeignVirtualOutput> = {};
    for (const out of externalOutputs) {
        const key = out.scriptPubKey ?? '';
        if (!map[key]) {
            map[key] = { scriptPubKey: key, totalAmount: 0, scriptType: getScriptType(key) };
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        map[key]!.totalAmount += out.value;
    }

    return Object.values(map);
};

// ─── anonymity contribution ───────────────────────────────────────────────────

/**
 * How much the foreign outputs contribute to the anonymity of one wallet virtual output.
 * Only foreign Taproot outputs are counted (matching wallet output script type).
 * Source: CoinjoinAnalyzer.ComputeAnonymityContribution
 *
 * Note: input sanctions are always 0 in this model because the dummy previous transactions
 * created for each internal input have no foreign outputs, yielding contribution = 0 and
 * therefore sanction = 0. As a result, startingAnonScore.standard === .sanctioned throughout.
 */
const computeAnonymityContribution = (
    virtualOutput: WalletVirtualOutput,
    allWalletVirtualOutputs: WalletVirtualOutput[],
    foreignVirtualOutputs: ForeignVirtualOutput[],
): number => {
    const { totalAmount } = virtualOutput;
    const equalWalletCount = allWalletVirtualOutputs.filter(
        o => o.totalAmount === totalAmount,
    ).length;
    if (equalWalletCount === 0) return 0;
    // Wallet outputs are Taproot; only count Taproot foreign outputs.
    const equalForeignCount = foreignVirtualOutputs.filter(
        o => o.totalAmount === totalAmount && o.scriptType === 'taproot',
    ).length;

    return equalForeignCount / equalWalletCount;
};

// ─── transaction analysis ─────────────────────────────────────────────────────

const analyzeTransaction = (tx: Tx, anonsets: Record<string, number>): void => {
    const ownInputCount = tx.internalInputs.length;
    const foreignInputCount = tx.externalInputs.length;
    const foreignOutputCount = tx.externalOutputs.length;

    // ── Receive: no wallet inputs, money comes from outside ────────────────────
    // Source: BlockchainAnalyzer.AnalyzeReceive
    if (ownInputCount === 0) {
        for (const out of tx.internalOutputs) {
            anonsets[out.address] = 1;
        }

        return;
    }

    // Validate that all internal inputs reference previously-known addresses.
    // If an internal input uses an address that was never an output in any prior transaction,
    // it indicates a missing transaction in the chain.
    // Source: BlockchainAnalyzer validation (via TransactionSummary.Validate)
    for (const inp of tx.internalInputs) {
        if (!(inp.address in anonsets)) {
            throw new Error(
                'There is an internal input that references a non-existing transaction',
            );
        }
    }

    const walletVirtualInputs = getWalletVirtualInputs(tx.internalInputs, anonsets);
    const internalInputAddressSet = new Set(tx.internalInputs.map(i => i.address));

    // ── Normal spend: all-wallet inputs, at least one foreign output ───────────
    // Source: BlockchainAnalyzer.AnalyzeNormalSpend
    if (foreignInputCount === 0 && foreignOutputCount > 0) {
        for (const addr of internalInputAddressSet) anonsets[addr] = 1;
        for (const out of tx.internalOutputs) anonsets[out.address] = 1;

        return;
    }

    const walletVirtualOutputs = getWalletVirtualOutputs(tx.internalOutputs);
    const foreignVirtualOutputs = getForeignVirtualOutputs(tx.externalOutputs);

    // ── Self-spend: all-wallet inputs, all-wallet outputs ─────────────────────
    // Source: BlockchainAnalyzer.AnalyzeSelfSpendWalletInputs/Outputs
    if (foreignInputCount === 0) {
        const startingAnonset = intersect(walletVirtualInputs.map(v => v.anonSet));

        // Update input anonsets (intersection penalty already applied above).
        for (const vIn of walletVirtualInputs) {
            anonsets[vIn.address] = startingAnonset;
        }

        // Update output anonsets.
        for (const vOut of walletVirtualOutputs) {
            const current = anonsets[vOut.address];
            anonsets[vOut.address] =
                current === undefined || !isFinite(current)
                    ? startingAnonset
                    : intersect([startingAnonset, current]); // address-reuse penalty
        }

        // AdjustWalletInputs: if any output ended up with a lower anonset than expected,
        // pull the input anonsets down to match.
        const outputAnonsets = tx.internalOutputs
            .map(o => anonsets[o.address])
            .filter((a): a is number => a !== undefined && isFinite(a));
        if (outputAnonsets.length > 0) {
            const smallestOutput = Math.min(...outputAnonsets);
            if (smallestOutput < startingAnonset) {
                for (const vIn of walletVirtualInputs) anonsets[vIn.address] = smallestOutput;
            }
        }

        return;
    }

    // ── Coinjoin: wallet inputs mixed with foreign inputs ──────────────────────
    // Source: BlockchainAnalyzer.AnalyzeCoinjoinWalletInputs/Outputs + AdjustWalletInputs

    // Starting anonset scores from inputs (sanctions = 0, so standard === sanctioned).
    // Source: BlockchainAnalyzer.CalculateWeightedAverage / CalculateMinAnonScore
    const mixedAnonScore = weightedMean(walletVirtualInputs);
    const nonMixedAnonScore = minAnonSet(walletVirtualInputs);

    // BigInputMinimum: minimum anonset of the leading wallet inputs (those appearing before
    // the first foreign input in the ordered input list). In this model, AddInternalInput
    // is always called before AddExternalInput, so ALL wallet inputs are "leading" and
    // bigInputMinimum === nonMixedAnonScore.
    // Source: BlockchainAnalyzer.CalculateHalfMixedAnonScore
    const bigInputMinimum = nonMixedAnonScore;

    const cjFlag = checkIsWasabi2Cj(tx);

    // For Wasabi 2 CJ: find the first foreign virtual output amount that appears more
    // than once among foreign virtual outputs. Wallet outputs at or below this amount
    // are considered standard denominations (WeightedAverage applies); those above use
    // BigInputMinimum instead.
    // Source: BlockchainAnalyzer.TryGetLargestEqualForeignOutputAmount
    let maxAmountForWeightedAverage = Infinity;
    if (cjFlag) {
        const amountCounts: Record<number, number> = {};
        for (const fvo of foreignVirtualOutputs) {
            amountCounts[fvo.totalAmount] = (amountCounts[fvo.totalAmount] ?? 0) + 1;
        }
        const repeatedAmounts = Object.entries(amountCounts)
            .filter(([, c]) => c > 1)
            .map(([a]) => Number(a));
        // Use the first repeated amount (matching C# FirstOrDefault behaviour).
        // Falls back to Infinity (= no upper bound) when none found.
        maxAmountForWeightedAverage =
            repeatedAmounts.length > 0 ? (repeatedAmounts[0] as number) : Infinity;
    }

    // Assign anonsets to wallet outputs.
    // Source: BlockchainAnalyzer.AnalyzeCoinjoinWalletOutputs
    const txSetAddresses = new Set<string>(); // addresses whose anonset was set during this tx
    for (const vOut of walletVirtualOutputs) {
        const hasForeignMatch = foreignVirtualOutputs.some(o => o.totalAmount === vOut.totalAmount);

        let startingScore: number;
        if (!hasForeignMatch) {
            // No foreign output with the same amount → likely change, not a standard denomination.
            if (cjFlag && STD_DENOMS.has(vOut.totalAmount)) {
                startingScore =
                    vOut.totalAmount <= maxAmountForWeightedAverage
                        ? mixedAnonScore
                        : bigInputMinimum;
            } else {
                startingScore = nonMixedAnonScore;
            }
        } else {
            // Foreign outputs exist with the same amount → output blends in with them.
            startingScore = mixedAnonScore;
        }

        const anonymityGain = Math.min(
            computeAnonymityContribution(vOut, walletVirtualOutputs, foreignVirtualOutputs),
            foreignInputCount,
        );

        // anonset = max(startingScore + gain, gain + 1, startingScore)
        // The three terms correspond to: sanctioned+gain, gain+1, standard (= sanctioned here).
        const anonset = Math.max(startingScore + anonymityGain, anonymityGain + 1, startingScore);

        const { address: addr } = vOut;
        const current = anonsets[addr];

        if (current === undefined || !isFinite(current)) {
            // Address seen for the first time as an output.
            anonsets[addr] = anonset;
            txSetAddresses.add(addr);
        } else if (internalInputAddressSet.has(addr)) {
            // Same address used as both input and output in this tx (key reuse in coinjoin).
            anonsets[addr] = startingScore;
            txSetAddresses.add(addr);
        } else if (txSetAddresses.has(addr)) {
            // Address appears in multiple virtual outputs within the same tx (single-reason update).
            anonsets[addr] = anonset;
        } else {
            // Address already has an anonset from a newer transaction → address reuse penalty.
            anonsets[addr] = intersect([anonset, current]);
            txSetAddresses.add(addr);
        }
    }

    // AdjustWalletInputs: if any output got a lower anonset than the weighted-average starting
    // score, bring the input anonsets down to the lowest output.
    // Source: BlockchainAnalyzer.AdjustWalletInputs
    const outputAnonsets = tx.internalOutputs
        .map(o => anonsets[o.address])
        .filter((a): a is number => a !== undefined && isFinite(a));
    if (outputAnonsets.length > 0) {
        const smallestOutput = Math.min(...outputAnonsets);
        if (smallestOutput < mixedAnonScore) {
            for (const vIn of walletVirtualInputs) anonsets[vIn.address] = smallestOutput;
        }
    }
};

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Calculates anonymity scores for all wallet addresses referenced across the provided
 * transactions. Mirrors the behaviour of GetAnonymityScoresHelper.GetAnonymityScores
 * in WalletWasabi.WabiSabiClientLibrary.
 */
export const getAnonymityScores = (request: GetAnonymityScoresRequest): AddressAnonymity[] => {
    // anonsets[address] = current anonymity set estimate.
    // undefined means "not yet set" (equivalent to HdPubKey.DefaultHighAnonymitySet = int.MaxValue).
    const anonsets: Record<string, number> = {};

    // Process newest transaction first (same as request.Transactions.Reverse() in C#).
    const reversed = [...request.transactions].reverse();

    // Collect addresses in the order they are first encountered (insertion order).
    // First-occurrence wins: we snapshot the anonset right after the newest tx
    // that references each address.
    // Source: AddressAnonymityCollection deduplication logic
    const addressOrder: string[] = [];
    const seenAddresses = new Set<string>();
    const snapshots: Record<string, number> = {};

    for (const tx of reversed) {
        analyzeTransaction(tx, anonsets);

        // Mirror GetAnonymitySets(): all addresses referenced by this tx become known.
        // Internal inputs come before internal outputs (matching TransactionLabelProvider
        // insertion order via AddInternalInput → AddInternalOutput).
        const txAddresses = [
            ...tx.internalInputs.map(i => i.address),
            ...tx.internalOutputs.map(o => o.address),
        ];
        for (const addr of txAddresses) {
            if (!seenAddresses.has(addr)) {
                seenAddresses.add(addr);
                addressOrder.push(addr);
                snapshots[addr] = anonsets[addr] ?? Infinity;
            }
        }
    }

    return addressOrder.map(addr => ({
        address: addr,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        anonymitySet: snapshots[addr]!,
    }));
};
