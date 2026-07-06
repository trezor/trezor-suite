import { type SignedTransactionResult } from '../assemble';
import { type DaemonOutput, type SendRawTransactionResult } from '../daemonRpc';
import { bytesToHex, hexToBytes } from '../hex';
import { type BulletproofPlus, type Clsag, writeBulletproofPlus, writeClsag } from '../rct';
import { type KeyImageInput, sendMoneroTransaction } from '../sendMoneroTransaction';
import { ByteWriter } from '../serialize';
import { type TxOut, writeTxOut } from '../transaction';

const DONATION =
    '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';

// A real ed25519 tx public key + view key (official key-derivation vector), so the commitment-mask
// derivation, which decodes the tx public key, has a valid point to work with.
const TX_PUBKEY = 'fdfd97d2ea9f1c25df773ff2c973d885653a3ee643157eb0ae2b6dd98f0b6984';
const VIEW_KEY = 'eb2bd1cf0c5e074f9dbf38ebbc99c316f54e21803048c687a3bb359f7a713b02';

const keyHex = (byte: number) => byte.toString(16).padStart(2, '0').repeat(32);
const keyBytes = (byte: number) => new Uint8Array(32).fill(byte);

const serialize = (fn: (w: ByteWriter) => void): string => {
    const writer = new ByteWriter();
    fn(writer);

    return bytesToHex(writer.toUint8Array());
};

// A parseable device result sized for N inputs / M outputs / ring 16 (mirrors signTransaction.test).
const buildDeviceResult = (numInputs: number, numOutputs: number): SignedTransactionResult => {
    const txOut: TxOut = { amount: 0n, target: { type: 'key', key: keyBytes(0x55) } };
    const bpp: BulletproofPlus = {
        A: keyBytes(1),
        A1: keyBytes(2),
        B: keyBytes(3),
        r1: keyBytes(4),
        s1: keyBytes(5),
        d1: keyBytes(6),
        L: [keyBytes(7), keyBytes(8)],
        R: [keyBytes(9), keyBytes(10)],
    };
    const clsag: Clsag = {
        s: Array.from({ length: 16 }, (_, i) => keyBytes(0x20 + i)),
        c1: keyBytes(0x80),
        D: keyBytes(0x81),
    };

    return {
        signatures: Array.from({ length: numInputs }, () => serialize(w => writeClsag(w, clsag))),
        rv: { rv_type: 6, txn_fee: 10_000_000_000 },
        pseudo_outs: Array.from({ length: numInputs }, (_, i) => bytesToHex(keyBytes(0x90 + i))),
        // The device returns out_pk as a 64-byte ctkey (dest || commitment); the assembler trims it.
        out_pks: Array.from({ length: numOutputs }, (_, i) =>
            bytesToHex(new Uint8Array(64).fill(0x91 + i)),
        ),
        ecdh_infos: Array.from({ length: numOutputs }, (_, i) =>
            bytesToHex(new Uint8Array(8).fill(i + 1)),
        ),
        tx_outs: Array.from({ length: numOutputs }, () => serialize(w => writeTxOut(w, txOut))),
        rsig_parts: [serialize(w => writeBulletproofPlus(w, bpp))],
        extra: '',
    };
};

const outputDummy = (): DaemonOutput => ({
    key: keyBytes(0xcc),
    mask: keyBytes(0xdd),
    height: 1,
    unlocked: true,
});

const sendResult = (over: Partial<SendRawTransactionResult>): SendRawTransactionResult => ({
    ok: true,
    status: 'OK',
    reason: '',
    notRelayed: false,
    doubleSpend: false,
    invalidInput: false,
    invalidOutput: false,
    lowMixin: false,
    overspend: false,
    feeTooLow: false,
    tooBig: false,
    raw: {},
    ...over,
});

// One spendable 2 XMR output; its source tx exposes the output at vout index 1.
const walletOutputs = [
    {
        amount: '2000000000000',
        globalIndex: 100,
        subaddrMinor: 0,
        stealthPublicKey: keyHex(0xaa),
        txHash: 'txA',
        locked: false,
        frozen: false,
    },
];
const sourceTx = {
    hash: 'txA',
    voutStealthKeys: [keyHex(0x11), keyHex(0xaa)],
    extra: Uint8Array.from([0x01, ...hexToBytes(TX_PUBKEY)]),
};

type Relay = { hex: string; doNotRelay: boolean };

const makeDaemon = (
    relays: Relay[],
    validation: SendRawTransactionResult,
    // Per-key-image spent status (0 = unspent); defaults to all unspent.
    spentStatus: (keyImages: string[]) => number[] = keyImages => keyImages.map(() => 0),
) => ({
    getTransactions: (hashes: string[]) =>
        Promise.resolve(hashes.includes('txA') ? [sourceTx] : []),
    getOuts: (outs: { amount: number | bigint; index: number | bigint }[]) =>
        Promise.resolve(outs.map(outputDummy)),
    isKeyImageSpent: (keyImages: string[]) => Promise.resolve(spentStatus(keyImages)),
    sendRawTransaction: (hex: string, doNotRelay = false) => {
        relays.push({ hex, doNotRelay });

        return Promise.resolve(validation);
    },
});

const selectDecoys = (count: number) => Array.from({ length: count }, (_, i) => 1000 + i);
// One device export per owned output: key image (+ spend signature). The send uses only the key
// image; the signature rides along for the after-send import.
const getKeyImages = (inputs: KeyImageInput[]) =>
    Promise.resolve(
        inputs.map((_, i) => ({ keyImage: keyBytes(0x70 + i), signature: keyBytes(0xb0 + i) })),
    );

describe('sendMoneroTransaction', () => {
    it('selects, signs and broadcasts a transaction in a single submission', async () => {
        const relays: Relay[] = [];
        const result = await sendMoneroTransaction({
            walletOutputs,
            viewKey: VIEW_KEY,
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
            daemon: makeDaemon(relays, sendResult({})),
            selectDecoys,
            getKeyImages,
            signer: (tsxData: any) =>
                Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
        });

        expect(result.relayed).toBe(true);
        expect(result.fee).toBeGreaterThan(0);
        // change = inputs(2 XMR) - send(1 XMR) - fee
        expect(result.change).toBe(2_000_000_000_000 - 1_000_000_000_000 - result.fee);
        // The tx is submitted to monerod exactly once, as a real broadcast (never a do_not_relay
        // "validation" pass — that would pool the tx and block the subsequent broadcast).
        expect(relays.map(r => r.doNotRelay)).toEqual([false]);
        expect(relays[0]?.hex).toBe(result.txHex);
        // The single device key-image export is returned (key image + spend signature) so the
        // after-send import reuses it instead of a second device round-trip.
        expect(result.keyImages).toEqual([{ keyImage: keyBytes(0x70), signature: keyBytes(0xb0) }]);
    });

    it('excludes a time-locked output from selection', async () => {
        const relays: Relay[] = [];
        // The only owned output is still locked → nothing spendable, so the send must fail clearly
        // rather than build a tx monerod would reject for spending a locked input.
        await expect(
            sendMoneroTransaction({
                walletOutputs: [{ ...walletOutputs[0]!, locked: true }],
                viewKey: VIEW_KEY,
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon(relays, sendResult({})),
                selectDecoys,
                getKeyImages,
                signer: (tsxData: any) =>
                    Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
            }),
        ).rejects.toThrow(/no spendable outputs/);
        // Key images are still exported (the device sees every output), but nothing is built/sent.
        expect(relays).toHaveLength(0);
    });

    it('excludes a wallet-frozen output from selection', async () => {
        const relays: Relay[] = [];
        // A frozen output is unspent + unlocked on-chain but wallet2 deems it unsafe to spend; the
        // send must skip it (it was filtered before; the allOutputs path must not regress that).
        await expect(
            sendMoneroTransaction({
                walletOutputs: [{ ...walletOutputs[0]!, frozen: true }],
                viewKey: VIEW_KEY,
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon(relays, sendResult({})),
                selectDecoys,
                getKeyImages,
                signer: (tsxData: any) =>
                    Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
            }),
        ).rejects.toThrow(/no spendable outputs/);
        expect(relays).toHaveLength(0);
    });

    it('returns the full key-image set in wallet transfer order, not the selected/sorted order', async () => {
        // Two owned outputs in transfer order [out0(0xaa), out1(0xbb)]. Both their amounts (1, 3 XMR)
        // and their key images (0x70 < 0x71) put out1 first under a value- or key-image-descending
        // sort — so if the returned set ever leaked the selected/sorted order it would be [out1, out0].
        const twoOut = [
            { ...walletOutputs[0]!, amount: '1000000000000', stealthPublicKey: keyHex(0xaa) },
            { ...walletOutputs[0]!, amount: '3000000000000', stealthPublicKey: keyHex(0xbb) },
        ];
        const twoOutTx = {
            hash: 'txA',
            voutStealthKeys: [keyHex(0xaa), keyHex(0xbb)],
            extra: Uint8Array.from([0x01, ...hexToBytes(TX_PUBKEY)]),
        };
        const relays: Relay[] = [];
        const daemon = {
            getTransactions: (hashes: string[]) =>
                Promise.resolve(hashes.includes('txA') ? [twoOutTx] : []),
            getOuts: (outs: { amount: number | bigint; index: number | bigint }[]) =>
                Promise.resolve(outs.map(outputDummy)),
            isKeyImageSpent: (kis: string[]) => Promise.resolve(kis.map(() => 0)),
            sendRawTransaction: (hex: string, doNotRelay = false) => {
                relays.push({ hex, doNotRelay });

                return Promise.resolve(sendResult({}));
            },
        };

        const result = await sendMoneroTransaction({
            walletOutputs: twoOut,
            viewKey: VIEW_KEY,
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
            daemon,
            selectDecoys,
            getKeyImages,
            signer: (tsxData: any) =>
                Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
        });

        // import_key_images is positional (keyImages[i] -> m_transfers[i]), so the returned set must
        // stay in the wallet's transfer order regardless of how inputs were selected/sorted for vins.
        expect(result.keyImages).toEqual([
            { keyImage: keyBytes(0x70), signature: keyBytes(0xb0) },
            { keyImage: keyBytes(0x71), signature: keyBytes(0xb1) },
        ]);
    });

    it('signs but does not submit to the daemon when doNotRelay is set', async () => {
        const relays: Relay[] = [];
        const result = await sendMoneroTransaction({
            walletOutputs,
            viewKey: VIEW_KEY,
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
            doNotRelay: true,
            daemon: makeDaemon(relays, sendResult({})),
            selectDecoys,
            getKeyImages,
            signer: (tsxData: any) =>
                Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
        });

        expect(result.relayed).toBe(false);
        expect(result.txHex).toMatch(/^[0-9a-f]+$/);
        // The daemon was not touched at all; the push step performs the single submission.
        expect(relays).toHaveLength(0);
    });

    it('throws and reports the reason when monerod rejects the broadcast', async () => {
        const relays: Relay[] = [];
        await expect(
            sendMoneroTransaction({
                walletOutputs,
                viewKey: VIEW_KEY,
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon(
                    relays,
                    sendResult({ ok: false, status: 'Failed', reason: 'fee too low' }),
                ),
                selectDecoys,
                getKeyImages,
                signer: (tsxData: any) =>
                    Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
            }),
        ).rejects.toThrow(/rejected.*fee too low/);

        // Exactly one submission ran — the broadcast — and it was rejected.
        expect(relays.map(r => r.doNotRelay)).toEqual([false]);
    });

    it('surfaces the rejection flag when monerod returns an empty reason', async () => {
        await expect(
            sendMoneroTransaction({
                walletOutputs,
                viewKey: VIEW_KEY,
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon(
                    [],
                    sendResult({ ok: false, status: 'Failed', reason: '', invalidInput: true }),
                ),
                selectDecoys,
                getKeyImages,
                signer: (tsxData: any) =>
                    Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
            }),
        ).rejects.toThrow(/invalid input/);
    });

    it('excludes outputs the chain reports as already spent', async () => {
        const relays: Relay[] = [];
        // The wallet's single output is reported spent (status 1) — a watch-only wallet could not have
        // known this. With nothing spendable left, the send must fail clearly rather than double-spend.
        await expect(
            sendMoneroTransaction({
                walletOutputs,
                viewKey: VIEW_KEY,
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon(relays, sendResult({}), keyImages => keyImages.map(() => 1)),
                selectDecoys,
                getKeyImages,
                signer: (tsxData: any) =>
                    Promise.resolve(buildDeviceResult(tsxData.num_inputs, tsxData.outputs.length)),
            }),
        ).rejects.toThrow(/no spendable outputs/);

        // The transaction was never built, so nothing was sent for validation.
        expect(relays).toHaveLength(0);
    });

    it('rejects an empty destination list', async () => {
        await expect(
            sendMoneroTransaction({
                walletOutputs,
                viewKey: VIEW_KEY,
                destinations: [],
                changeAddress: DONATION,
                fee: { baseFeePerByte: 20000, quantizationMask: 10000 },
                daemon: makeDaemon([], sendResult({})),
                selectDecoys,
                getKeyImages,
                signer: () => Promise.resolve(buildDeviceResult(1, 2)),
            }),
        ).rejects.toThrow(/at least one destination/);
    });
});
