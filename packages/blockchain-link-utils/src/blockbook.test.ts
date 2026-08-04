import * as fixtures from './__fixtures__/blockbook';
import {
    filterEthereumInternalTransfers,
    filterTokenTransfers,
    transformAccountInfo,
    transformAccountUtxo,
    transformAddresses,
    transformTokenInfo,
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

    describe('filterEthereumInternalTransfers poison-record DoS resistance', () => {
        // ethereumSpecific.internalTransfers comes verbatim from an untrusted/user-selectable blockbook
        // backend. A null / non-object entry would throw on destructuring (unlike the guarded
        // filterTokenTransfers sibling) and abort the whole account-history .map (per-account DoS).
        const address = '0x1111111111111111111111111111111111111111';
        const validTransfer = { type: 0, from: address, to: '0x2222', value: '5' };

        it('drops a poison null entry and keeps the valid internal transfer', () => {
            let result: ReturnType<typeof filterEthereumInternalTransfers>;
            expect(
                () =>
                    (result = filterEthereumInternalTransfers(address, {
                        // @ts-expect-error poison null element among typed transfers
                        internalTransfers: [validTransfer, null],
                    })),
            ).not.toThrow();
            expect(result!).toHaveLength(1);
            expect(result![0]).toMatchObject({ type: 'sent', amount: '5', from: address });
        });

        it('does not fail the whole account history when a tx carries a poison internal transfer', () => {
            const evmTx = {
                vin: [{ addresses: [address] }],
                vout: [{ addresses: ['0x2222'] }],
                ethereumSpecific: {
                    status: 1,
                    gasLimit: 21000,
                    gasUsed: 21000,
                    gasPrice: '3',
                    internalTransfers: [validTransfer, null],
                },
                value: '90',
                valueIn: '100',
                fees: '10',
            };
            const payload = {
                address,
                balance: '0',
                unconfirmedBalance: '0',
                txs: 1,
                unconfirmedTxs: 0,
                nonce: '0',
                transactions: [evmTx],
            };
            let account: ReturnType<typeof transformAccountInfo>;
            // @ts-expect-error minimal payload shape
            expect(() => (account = transformAccountInfo(payload))).not.toThrow();
            expect(account!.history.transactions?.length).toBe(1);
        });
    });

    describe('filterTokenTransfers contract normalization (poison-record DoS resistance)', () => {
        // TokenTransfer.contract is typed as a required string, but an untrusted/user-selectable
        // blockbook backend may omit it. Downstream render-time code (transaction list) deref's
        // token.contract.toLowerCase() and passes it to getContractAddressForNetworkSymbol with no
        // ErrorBoundary, so a contract-less record would crash the whole account view. The util now
        // normalizes contract to a string so runtime honors the declared type.
        const address = '0x1111111111111111111111111111111111111111';

        it('normalizes a missing contract to an empty string and keeps the transfer', () => {
            const result = filterTokenTransfers(address, [
                // @ts-expect-error poison record missing the required contract field
                { from: address, to: '0x2222', decimals: 18, value: '7' },
            ]);
            expect(result).toHaveLength(1);
            expect(result[0]?.contract).toBe('');
        });

        it('produces tokens whose contract is always deref-safe (.toLowerCase does not throw)', () => {
            const result = filterTokenTransfers(address, [
                // @ts-expect-error poison record missing the required contract field
                { from: address, to: '0x2222', decimals: 18, value: '7' },
            ]);
            expect(() => result.map(t => t.contract.toLowerCase())).not.toThrow();
        });
    });

    describe('transformTokenInfo contract normalization (poison-record DoS resistance)', () => {
        // Token.contract is optional on the untrusted/user-selectable blockbook backend, but
        // TokenInfo.contract is a required string. Consumers of AccountInfo.tokens deref it
        // unconditionally (e.g. accountsThunks fetchAccountTokens `p.contract.toLowerCase()` on the
        // EVM branch, token-definition selectors), so a contract-less token would abort the whole
        // account update. transformTokenInfo now normalizes contract to a string.
        it('normalizes a missing contract to an empty string and keeps the token', () => {
            const result = transformTokenInfo([
                // @ts-expect-error poison record missing the required contract field
                { type: 'ERC20', standard: 'ERC20', name: 'X', symbol: 'X', decimals: 18 },
            ]);
            expect(result).toHaveLength(1);
            expect(result?.[0]?.contract).toBe('');
        });

        it('produces tokens whose contract is always deref-safe (.toLowerCase does not throw)', () => {
            const result = transformTokenInfo([
                // @ts-expect-error poison record missing the required contract field
                { type: 'ERC20', standard: 'ERC20', name: 'X', symbol: 'X', decimals: 18 },
            ]);
            expect(() => (result ?? []).map(t => t.contract.toLowerCase())).not.toThrow();
        });

        it('preserves a valid contract value unchanged', () => {
            const result = transformTokenInfo([
                {
                    type: 'ERC20',
                    standard: 'ERC20',
                    name: 'X',
                    symbol: 'X',
                    contract: '0xAbC',
                    decimals: 18,
                },
            ]);
            expect(result?.[0]?.contract).toBe('0xAbC');
        });
    });

    describe('transformAccountUtxo poison-record DoS resistance', () => {
        const validUtxo = {
            txid: 'abcd',
            vout: 0,
            value: '1000',
            height: 100,
            address: 'bc1qexampleaddress',
            path: "m/84'/0'/0'/0/0",
            confirmations: 3,
        };

        it('returns [] for a non-array response instead of throwing', () => {
            // An untrusted/user-selectable blockbook backend can return a non-array (e.g. {} / null)
            // for getAccountUtxo; `payload.map` would then throw and fail the whole request.
            // @ts-expect-error malformed non-array payload
            expect(() => transformAccountUtxo({})).not.toThrow();
            // @ts-expect-error malformed non-array payload
            expect(transformAccountUtxo({})).toEqual([]);
            // @ts-expect-error malformed non-array payload
            expect(transformAccountUtxo(null)).toEqual([]);
        });

        it('drops a poison non-object entry and keeps the valid UTXOs', () => {
            const payload = [null, validUtxo];
            let result: ReturnType<typeof transformAccountUtxo>;
            // @ts-expect-error poison null element
            expect(() => (result = transformAccountUtxo(payload))).not.toThrow();
            expect(result!).toHaveLength(1);
            expect(result![0]).toMatchObject({ txid: 'abcd', amount: '1000' });
        });
    });
});
