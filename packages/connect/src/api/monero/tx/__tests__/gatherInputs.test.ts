import { deriveCommitmentMask } from '../commitmentMask';
import type { SourceTransaction } from '../daemonRpc';
import { type WalletOutput, gatherSpendableInputs } from '../gatherInputs';
import { hexToBytes } from '../hex';

const key = (byte: number) => byte.toString(16).padStart(2, '0').repeat(32);
// A real ed25519 point (official key-derivation vector R) so the commitment-mask derivation, which
// decodes the tx public key, has a valid point to work with. The stealth keys used for vout matching
// can stay arbitrary — resolveSourceOutput only compares them as hex strings.
const TX_PUBKEY = 'fdfd97d2ea9f1c25df773ff2c973d885653a3ee643157eb0ae2b6dd98f0b6984';
const VIEW_KEY = 'eb2bd1cf0c5e074f9dbf38ebbc99c316f54e21803048c687a3bb359f7a713b02';
const mainKeyExtra = (pubKey: string) => Uint8Array.from([0x01, ...hexToBytes(pubKey)]);

// Stub daemon that records the requested hashes and returns prepared source transactions.
const stubDaemon = (txs: SourceTransaction[], calls: string[][]) => ({
    getTransactions: (hashes: string[]) => {
        calls.push(hashes);

        return Promise.resolve(txs.filter(tx => hashes.includes(tx.hash)));
    },
});

describe('gatherSpendableInputs', () => {
    it('resolves each wallet output against its source tx and fills the spendable shape', async () => {
        const outputs: WalletOutput[] = [
            {
                amount: '1000000000000',
                globalIndex: 42,
                subaddrMinor: 0,
                stealthPublicKey: key(0x22),
                txHash: 'tx1',
                locked: false,
                frozen: false,
            },
        ];
        const txs: SourceTransaction[] = [
            {
                hash: 'tx1',
                voutStealthKeys: [key(0x11), key(0x22)],
                extra: mainKeyExtra(TX_PUBKEY),
            },
        ];

        const inputs = await gatherSpendableInputs(outputs, stubDaemon(txs, []), VIEW_KEY);

        expect(inputs).toEqual([
            {
                amount: 1000000000000,
                globalIndex: 42,
                realOutTxKey: TX_PUBKEY,
                realOutAdditionalTxKeys: [],
                realOutputInTxIndex: 1,
                subaddrMinor: 0,
                stealthPublicKey: key(0x22),
                locked: false, // copied through from the wallet output
                frozen: false, // copied through from the wallet output
                // Derived from the view key + tx public key + the resolved in-tx index (1).
                mask: deriveCommitmentMask({
                    viewKey: VIEW_KEY,
                    txPubKey: TX_PUBKEY,
                    outputIndex: 1,
                }),
            },
        ]);
    });

    it('carries the locked + frozen flags through to the resolved input', async () => {
        const outputs: WalletOutput[] = [
            {
                amount: '1000000000000',
                globalIndex: 42,
                subaddrMinor: 0,
                stealthPublicKey: key(0x22),
                txHash: 'tx1',
                locked: true,
                frozen: true,
            },
        ];
        const txs: SourceTransaction[] = [
            { hash: 'tx1', voutStealthKeys: [key(0x22)], extra: mainKeyExtra(TX_PUBKEY) },
        ];

        const inputs = await gatherSpendableInputs(outputs, stubDaemon(txs, []), VIEW_KEY);

        expect(inputs[0]?.locked).toBe(true);
        expect(inputs[0]?.frozen).toBe(true);
    });

    it('fetches each distinct source tx only once', async () => {
        const outputs: WalletOutput[] = [
            {
                amount: '1',
                globalIndex: 1,
                subaddrMinor: 0,
                stealthPublicKey: key(0x11),
                txHash: 'tx1',
                locked: false,
                frozen: false,
            },
            {
                amount: '2',
                globalIndex: 2,
                subaddrMinor: 0,
                stealthPublicKey: key(0x22),
                txHash: 'tx1',
                locked: false,
                frozen: false,
            },
        ];
        const txs: SourceTransaction[] = [
            {
                hash: 'tx1',
                voutStealthKeys: [key(0x11), key(0x22)],
                extra: mainKeyExtra(TX_PUBKEY),
            },
        ];
        const calls: string[][] = [];

        const inputs = await gatherSpendableInputs(outputs, stubDaemon(txs, calls), VIEW_KEY);

        expect(calls).toEqual([['tx1']]); // deduped to a single batched request
        expect(inputs.map(i => i.realOutputInTxIndex)).toEqual([0, 1]);
    });

    it('throws when the daemon does not return an output’s source tx', async () => {
        const outputs: WalletOutput[] = [
            {
                amount: '1',
                globalIndex: 1,
                subaddrMinor: 0,
                stealthPublicKey: key(0x11),
                txHash: 'missing',
                locked: false,
                frozen: false,
            },
        ];

        await expect(gatherSpendableInputs(outputs, stubDaemon([], []), VIEW_KEY)).rejects.toThrow(
            /source tx missing/,
        );
    });

    it('rejects an amount above the safe-integer range', async () => {
        const outputs: WalletOutput[] = [
            {
                amount: '9007199254740993', // 2^53 + 1
                globalIndex: 1,
                subaddrMinor: 0,
                stealthPublicKey: key(0x11),
                txHash: 'tx1',
                locked: false,
                frozen: false,
            },
        ];
        const txs: SourceTransaction[] = [
            { hash: 'tx1', voutStealthKeys: [key(0x11)], extra: mainKeyExtra(TX_PUBKEY) },
        ];

        await expect(gatherSpendableInputs(outputs, stubDaemon(txs, []), VIEW_KEY)).rejects.toThrow(
            /out of safe range/,
        );
    });
});
