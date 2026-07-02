import type { MoneroTxWallet } from 'monero-ts';

import { transformTransaction } from '../../src/workers/monero/transformTransaction';

const DESCRIPTOR =
    '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';
const EXTERNAL =
    '48daf1rG3hE1Txapcsxh6WXNe9MLNKtu7W7tKTivtSoVLHErYzvdcpea2nSTgGkz66RFP4GKVAsTV14v6G3oddBTHfxP6L';

// Amounts a tx exposes for the wallet's own inputs/outputs. 'throw' models the real monero-ts hazard:
// getInputsWallet()/getOutputsWallet() iterate getInputs()/getOutputs(), which are undefined and
// throw "not iterable" for a tx with no wallet inputs (recv) or no change (sweep).
type OwnAmounts = bigint[] | 'throw' | undefined;

interface MockTxConfig {
    incoming?: boolean;
    outgoing?: boolean;
    incomingAmount?: bigint;
    outgoingAmount?: bigint;
    fee?: bigint;
    hash?: string;
    height?: number;
    confirmed?: boolean; // false → no block (pending)
    weight?: number;
    size?: number;
    inputs?: OwnAmounts; // the wallet's own inputs (what it spent)
    outputs?: OwnAmounts; // the wallet's own outputs (change + self-destinations)
    destinations?: { address: string; amount: bigint }[]; // known recipients (wallet built the tx)
}

const ownGetter = (amounts: OwnAmounts) => () => {
    if (amounts === 'throw') throw new Error('not iterable');
    if (amounts === undefined) return undefined;

    return amounts.map(a => ({ getAmount: () => a }));
};

const makeTx = (c: MockTxConfig): MoneroTxWallet =>
    ({
        getIsIncoming: () => Boolean(c.incoming),
        getIsOutgoing: () => Boolean(c.outgoing),
        getIncomingAmount: () => c.incomingAmount ?? 0n,
        getOutgoingAmount: () => c.outgoingAmount ?? 0n,
        getFee: () => c.fee ?? 0n,
        getHash: () => c.hash ?? 'deadbeef',
        getHeight: () => c.height ?? 100,
        getBlock: () => (c.confirmed === false ? undefined : { getTimestamp: () => 1_700_000_000 }),
        getWeight: () => c.weight,
        getSize: () => c.size,
        getInputsWallet: ownGetter(c.inputs),
        getOutputsWallet: ownGetter(c.outputs),
        getOutgoingTransfer: () =>
            c.destinations
                ? {
                      getDestinations: () =>
                          c.destinations!.map(d => ({
                              getAddress: () => d.address,
                              getAmount: () => d.amount,
                          })),
                  }
                : undefined,
    }) as unknown as MoneroTxWallet;

describe('transformTransaction (Monero)', () => {
    it('classifies an incoming-only tx as recv (amount = received, no own vin)', () => {
        const tx = transformTransaction(makeTx({ incoming: true, incomingAmount: 5n }), DESCRIPTOR);
        expect(tx.type).toBe('recv');
        expect(tx.amount).toBe('5');
        expect(tx.details?.vin).toEqual([]);
        expect(tx.targets[0]?.addresses).toEqual([DESCRIPTOR]);
    });

    it('classifies a spend with known recipients as sent (amount = external destinations)', () => {
        const tx = transformTransaction(
            makeTx({
                outgoing: true,
                outgoingAmount: 10n,
                fee: 1n,
                destinations: [{ address: EXTERNAL, amount: 7n }],
            }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('sent');
        expect(tx.amount).toBe('7');
        expect(tx.targets[0]?.addresses).toEqual([EXTERNAL]);
        // an own input is flagged so Suite counts the fee (isTxFeePaid)
        expect(tx.details?.vin?.[0]).toMatchObject({ isOwn: true, value: '10' });
    });

    it('classifies a spend with unknown recipients (import) as sent via the accounting fallback', () => {
        // outgoing only, inputs not populated → not self; amount = outgoing - incoming - fee
        const tx = transformTransaction(
            makeTx({ outgoing: true, outgoingAmount: 10n, fee: 1n }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('sent');
        expect(tx.amount).toBe('9');
    });

    it('classifies a tx the wallet surfaces as both incoming and outgoing as self (amount = fee)', () => {
        const tx = transformTransaction(
            makeTx({ incoming: true, outgoing: true, incomingAmount: 99n, fee: 1n }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('self');
        expect(tx.amount).toBe('1'); // only the fee leaves
        expect(tx.targets[0]?.amount).toBe('99'); // returned to the wallet
    });

    it('recovers self from an outgoing-only tx when own inputs == own outputs + fee', () => {
        // the import-fold case: nothing went to an external address
        const tx = transformTransaction(
            makeTx({ outgoing: true, fee: 1n, inputs: [100n], outputs: [99n] }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('self');
        expect(tx.amount).toBe('1');
        expect(tx.targets[0]?.amount).toBe('99'); // own-outputs total when incoming is folded
    });

    it('keeps an outgoing tx as sent when value left the wallet (own inputs > own outputs + fee)', () => {
        const tx = transformTransaction(
            makeTx({
                outgoing: true,
                outgoingAmount: 49n,
                fee: 1n,
                inputs: [100n],
                outputs: [50n],
            }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('sent');
        expect(tx.amount).toBe('48'); // outgoing - incoming - fee
    });

    it('does not throw when getInputsWallet throws on a recv tx (the history-crash guard)', () => {
        expect(() =>
            transformTransaction(
                makeTx({ incoming: true, incomingAmount: 5n, inputs: 'throw' }),
                DESCRIPTOR,
            ),
        ).not.toThrow();
        const tx = transformTransaction(
            makeTx({ incoming: true, incomingAmount: 5n, inputs: 'throw' }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('recv');
    });

    it('does not throw for a sweep with no change (getOutputsWallet throws)', () => {
        const tx = transformTransaction(
            makeTx({
                outgoing: true,
                outgoingAmount: 99n,
                fee: 1n,
                inputs: [100n],
                outputs: 'throw',
            }),
            DESCRIPTOR,
        );
        expect(tx.type).toBe('sent');
        expect(tx.amount).toBe('98');
    });

    it('leaves blockHeight/blockTime undefined for an unconfirmed tx', () => {
        const tx = transformTransaction(
            makeTx({ incoming: true, incomingAmount: 5n, confirmed: false }),
            DESCRIPTOR,
        );
        expect(tx.blockHeight).toBeUndefined();
        expect(tx.blockTime).toBeUndefined();
    });

    it('uses weight for size and never reports zero (avoids fee-rate divide-by-zero)', () => {
        expect(
            transformTransaction(
                makeTx({ incoming: true, incomingAmount: 5n, weight: 1500 }),
                DESCRIPTOR,
            ).details?.size,
        ).toBe(1500);
        // no weight/size available → falls back to 1, not 0
        expect(
            transformTransaction(makeTx({ incoming: true, incomingAmount: 5n }), DESCRIPTOR).details
                ?.size,
        ).toBe(1);
    });
});
