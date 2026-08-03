import * as fixtures from './__fixtures__/blockbook';
import {
    filterTokenTransfers,
    transformAccountInfo,
    transformAddresses,
    transformTransaction,
} from './blockbook';

describe('blockbook/utils', () => {
    describe('filterTokenTransfers', () => {
        fixtures.filterTokenTransfers.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const transfers = filterTokenTransfers(f.addresses, f.transfers);
                expect(transfers).toEqual(f.parsed);
            });
        });
    });

    describe('transformTransaction', () => {
        // [btc-unknown-tx-debug] transformTransaction emits a temporary console.error when it classifies
        // a tx as 'unknown' with account context. Silence the JestCustomEnv console.error trap for these
        // classification fixtures (the only console.error in transformTransaction is that diagnostic).
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const tx = transformTransaction(f.tx, f.addresses ?? f.descriptor);
                expect(tx).toMatchObject(f.parsed);
            });
        });
    });

    describe('poison-record DoS resistance (missing XPUBAddress path)', () => {
        // An untrusted/user-selectable blockbook backend may return an XPUBAddress token with the
        // (type-optional) `path` field omitted; `a.path.split('/')` in transformAddresses would then
        // throw and abort the whole account's transformAccountInfo (all txs/balances fail to load).
        const validToken = {
            type: 'XPUBAddress' as const,
            name: 'addr-valid',
            path: "m/84'/0'/0'/0/0",
            transfers: 1,
            balance: '0',
            totalSent: '0',
            totalReceived: '0',
        };
        const poisonToken = {
            type: 'XPUBAddress' as const,
            name: 'addr-nopath',
            transfers: 0,
            balance: '0',
            totalSent: '0',
            totalReceived: '0',
        };

        it('drops a path-less XPUBAddress token instead of throwing', () => {
            let result: ReturnType<typeof transformAddresses>;
            // @ts-expect-error minimal token shape
            expect(() => (result = transformAddresses([validToken, poisonToken]))).not.toThrow();
            const all = [
                ...(result?.change ?? []),
                ...(result?.used ?? []),
                ...(result?.unused ?? []),
            ];
            expect(all.map(a => a.address)).toEqual(['addr-valid']);
        });

        it('does not fail the whole account when one XPUBAddress token lacks a path', () => {
            const payload = {
                address: 'addr-valid',
                balance: '0',
                unconfirmedBalance: '0',
                txs: 0,
                unconfirmedTxs: 0,
                tokens: [validToken, poisonToken],
            };
            let account: ReturnType<typeof transformAccountInfo>;
            // @ts-expect-error minimal payload shape
            expect(() => (account = transformAccountInfo(payload))).not.toThrow();
            expect(account!.addresses?.used.map(a => a.address)).toEqual(['addr-valid']);
        });
    });

    describe('poison-record DoS resistance (missing EVM descriptor)', () => {
        // An untrusted/user-selectable blockbook backend may return an EVM (nonce present) account payload
        // with the (type-required) `address` field omitted; `descriptor.toLowerCase()` in the EVM
        // shadowed-pending-tx filter would then throw and abort the whole account's transformAccountInfo.
        const evmTx = {
            vin: [{ addresses: ['A'] }],
            vout: [{ addresses: ['B'] }],
            ethereumSpecific: { status: 1, gasLimit: 21000, gasUsed: 21000, gasPrice: '3' },
            value: '90',
            valueIn: '100',
            fees: '10',
        };

        it('does not fail the whole EVM account when the address descriptor is missing', () => {
            const payload = {
                // no `address` field — a malicious/MITM backend can omit the echoed descriptor
                balance: '0',
                unconfirmedBalance: '0',
                txs: 1,
                unconfirmedTxs: 0,
                nonce: '0', // marks the payload as EVM (isEVM = typeof payload.nonce === 'string')
                transactions: [evmTx],
            };
            let account: ReturnType<typeof transformAccountInfo>;
            // @ts-expect-error minimal payload shape
            expect(() => (account = transformAccountInfo(payload))).not.toThrow();
            expect(account!.history.transactions?.length).toBe(1);
        });
    });
});
