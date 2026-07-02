// Turn the scanning wallet's raw spendable outputs (what blockchain-link reports in
// misc.moneroOutputs) into the SpendableOutputs the send pipeline consumes. Each output's source
// transaction is fetched once from the daemon to resolve the output's in-tx position and the tx
// public key(s) needed to spend it. Pure assembly + one batched daemon call, so it is unit-testable
// with a stub daemon.
import type { SpendableOutput } from './buildInputs';
import { deriveCommitmentMask } from './commitmentMask';
import type { MoneroDaemonRpc } from './daemonRpc';
import { resolveSourceOutput } from './resolveSourceOutput';

/** Raw spendable output as reported by the scanning wallet (blockchain-link MoneroSpendableOutput). */
export interface WalletOutput {
    amount: string;
    globalIndex: number;
    subaddrMinor: number;
    stealthPublicKey: string;
    txHash: string;
    /** Time-locked (not yet spendable). Only ever true in the unfiltered allOutputs set. */
    locked: boolean;
    /** Wallet-frozen (deemed unsafe to spend). Only ever true in the unfiltered allOutputs set. */
    frozen: boolean;
}

/**
 * A spendable output resolved against its source transaction, ready for the send pipeline. Extends
 * SpendableOutput with the output's one-time key (out_key), which the key-image sync needs but the
 * ring/compose steps do not.
 */
export interface SpendableInput extends SpendableOutput {
    /** The output's one-time public key (out_key), hex. */
    stealthPublicKey: string;
    /** Time-locked (not yet spendable) — the send selects only unlocked inputs. */
    locked: boolean;
    /** Wallet-frozen (unsafe to spend) — the send skips frozen inputs. */
    frozen: boolean;
}

// Amounts cross the worker boundary as decimal strings (a single output can exceed 2^53). The send
// pipeline does its arithmetic in JS numbers (matching the Type.Uint protobuf fields), so reject an
// out-of-range amount loudly here instead of silently losing precision later.
const toSafeAmount = (amount: string): number => {
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`gatherSpendableInputs: output amount ${amount} is out of safe range`);
    }

    return value;
};

export const gatherSpendableInputs = async (
    outputs: WalletOutput[],
    daemon: Pick<MoneroDaemonRpc, 'getTransactions'>,
    /** Wallet private view key (32-byte hex), used to derive each output's commitment mask. */
    viewKey: string,
): Promise<SpendableInput[]> => {
    const hashes = [...new Set(outputs.map(output => output.txHash))];
    const txs = await daemon.getTransactions(hashes);
    const byHash = new Map(txs.map(tx => [tx.hash, tx]));

    return outputs.map(output => {
        const tx = byHash.get(output.txHash);
        if (!tx) {
            throw new Error(
                `gatherSpendableInputs: source tx ${output.txHash} was not returned by the daemon`,
            );
        }

        const { realOutputInTxIndex, realOutTxKey, realOutAdditionalTxKeys } = resolveSourceOutput(
            output.stealthPublicKey,
            tx,
        );

        // Subaddress outputs are decoded against the per-output additional tx key; a main-address
        // output uses the single transaction public key.
        const derivationKey =
            output.subaddrMinor !== 0
                ? (realOutAdditionalTxKeys[realOutputInTxIndex] ?? realOutTxKey)
                : realOutTxKey;

        return {
            amount: toSafeAmount(output.amount),
            globalIndex: output.globalIndex,
            realOutTxKey,
            realOutAdditionalTxKeys,
            realOutputInTxIndex,
            subaddrMinor: output.subaddrMinor,
            stealthPublicKey: output.stealthPublicKey,
            locked: output.locked,
            frozen: output.frozen,
            // The firmware recomputes and verifies this against the on-chain commitment when signing,
            // so it must be the output's real blinding factor — derived here from the view key.
            mask: deriveCommitmentMask({
                viewKey,
                txPubKey: derivationKey,
                outputIndex: realOutputInTxIndex,
            }),
        } satisfies SpendableInput;
    });
};
