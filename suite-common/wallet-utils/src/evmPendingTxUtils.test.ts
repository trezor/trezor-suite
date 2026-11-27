import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getWrappedNativeAddress } from '@trezor/network-ethereum-suite-common';

import {
    findTrackedEvmTransaction,
    getEvmPendingTxStatus,
    getTrackedWrappedNativeTxid,
} from './evmPendingTxUtils';

const wrappedNativeAddress = getWrappedNativeAddress(asNetworkSymbol('eth'))!;
const vaultAddress = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';
// deposit(uint256 assets, address receiver) into the vault.
const vaultDepositData =
    '0x6e553f65000000000000000000000000000000000000000000000000000000000098968000000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';

const accountDescriptor = '0x09ea3721b5bf3b64b4418c38b603154d2d597fae3';
const foreignSigner = '0x0f6666bc699aec39b846e898473e9caec5a6b821';
type CreateTransactionParams = {
    txid: string;
    nonce: number;
    data?: string;
    targetAddress?: string;
    value?: string;
    blockHeight?: number;
    type?: WalletAccountTransaction['type'];
    signer?: string;
};

// `signer` decides authorship (see isSignedByAccount): only a transaction this account signed
// carries the account's own nonce, so a foreign one must never be mistaken for a replacement.
const createTransaction = ({
    txid,
    nonce,
    data = '0xd0e30db0',
    targetAddress = wrappedNativeAddress,
    value = '0',
    blockHeight = 1,
    type = 'sent',
    signer = accountDescriptor,
}: CreateTransactionParams) =>
    ({
        txid,
        symbol: 'eth',
        type,
        blockHeight,
        descriptor: accountDescriptor,
        details: {
            vin: [{ n: 0, isAddress: true, addresses: [signer] }],
            vout: [{ n: 0, isAddress: true, addresses: [targetAddress], value }],
        },
        targets: [{ addresses: [targetAddress] }],
        internalTransfers: [],
        ethereumSpecific: {
            nonce,
            data,
            status: blockHeight > 0 ? 1 : -1,
        },
    }) as unknown as WalletAccountTransaction;

describe('EVM pending transaction tracking', () => {
    it('finds a replacement by its EVM nonce after the original txid disappears', () => {
        const replacement = createTransaction({ txid: 'replacement', nonce: 7 });

        expect(
            findTrackedEvmTransaction({
                transactions: [replacement],
                txid: 'original',
                nonce: 7,
            }),
        ).toEqual({ transaction: replacement, isReplacement: true });
    });

    it('finds an own replacement that reverted on-chain', () => {
        const reverted = createTransaction({ txid: 'replacement', nonce: 7, type: 'failed' });

        expect(
            findTrackedEvmTransaction({
                transactions: [reverted],
                txid: 'original',
                nonce: 7,
            }),
        ).toEqual({ transaction: reverted, isReplacement: true });
    });

    it('ignores an incoming transaction that coincidentally reuses the nonce', () => {
        // `ethereumSpecific.nonce` of a received transaction is the sender's counter, so a match
        // with our nonce is a coincidence and must not resolve the flow.
        expect(
            findTrackedEvmTransaction({
                transactions: [
                    createTransaction({
                        txid: 'incoming',
                        nonce: 7,
                        type: 'recv',
                        signer: foreignSigner,
                    }),
                ],
                txid: 'original',
                nonce: 7,
            }),
        ).toBeUndefined();
    });

    it('ignores a foreign transaction reverted on-chain at the same nonce', () => {
        // A reverted incoming transaction is relabelled 'failed' rather than 'recv', so authorship
        // — not the display type — is what keeps it out of the nonce lookup.
        expect(
            findTrackedEvmTransaction({
                transactions: [
                    createTransaction({
                        txid: 'foreign-failed',
                        nonce: 7,
                        type: 'failed',
                        signer: foreignSigner,
                    }),
                ],
                txid: 'original',
                nonce: 7,
            }),
        ).toBeUndefined();
    });

    it('picks the own replacement over a foreign transaction at the same nonce', () => {
        const replacement = createTransaction({ txid: 'replacement', nonce: 7 });

        expect(
            findTrackedEvmTransaction({
                transactions: [
                    createTransaction({
                        txid: 'incoming',
                        nonce: 7,
                        type: 'recv',
                        signer: foreignSigner,
                    }),
                    replacement,
                ],
                txid: 'original',
                nonce: 7,
            }),
        ).toEqual({ transaction: replacement, isReplacement: true });
    });

    it('does not look for a replacement without a nonce to follow', () => {
        expect(
            findTrackedEvmTransaction({
                transactions: [createTransaction({ txid: 'replacement', nonce: 7 })],
                txid: 'original',
            }),
        ).toBeUndefined();
    });

    it('stays pending while the transaction is not mined', () => {
        expect(
            getEvmPendingTxStatus({
                txid: 'original',
                trackedTransaction: {
                    transaction: createTransaction({
                        txid: 'original',
                        nonce: 7,
                        blockHeight: 0,
                    }),
                    isReplacement: false,
                },
                expectedPurpose: 'wrap',
            }),
        ).toBe('pending');
    });

    it('stays pending while nothing is tracked yet', () => {
        expect(
            getEvmPendingTxStatus({
                txid: 'original',
                trackedTransaction: undefined,
                expectedPurpose: 'deposit',
            }),
        ).toBe('pending');
    });

    it('confirms a vault replacement that preserves the operation', () => {
        const replacement = createTransaction({
            txid: 'replacement',
            nonce: 7,
            data: vaultDepositData,
            targetAddress: vaultAddress,
        });

        expect(
            getEvmPendingTxStatus({
                txid: 'original',
                trackedTransaction: { transaction: replacement, isReplacement: true },
                expectedPurpose: 'deposit',
            }),
        ).toBe('confirmed');
    });

    it('fails when the transaction is replaced by a different operation', () => {
        const cancellation = createTransaction({
            txid: 'cancellation',
            nonce: 7,
            data: '0x',
        });

        expect(
            getEvmPendingTxStatus({
                txid: 'original',
                trackedTransaction: { transaction: cancellation, isReplacement: true },
                expectedPurpose: 'wrap',
            }),
        ).toBe('failed');
    });

    it('trusts a confirmation under the tracked txid without re-deriving its purpose', () => {
        // A txid commits to the calldata that was signed, so the transaction the account lists
        // under it is the submitted one whatever its purpose resolves to.
        const opaque = createTransaction({ txid: 'deposit', nonce: 7, data: '0xdeadbeef' });

        expect(
            getEvmPendingTxStatus({
                txid: 'deposit',
                trackedTransaction: { transaction: opaque, isReplacement: false },
                expectedPurpose: 'deposit',
            }),
        ).toBe('confirmed');
    });

    it('confirms a vault deposit that was mined as submitted', () => {
        const deposit = createTransaction({
            txid: 'deposit',
            nonce: 7,
            data: vaultDepositData,
            targetAddress: vaultAddress,
        });

        expect(
            getEvmPendingTxStatus({
                txid: 'deposit',
                trackedTransaction: { transaction: deposit, isReplacement: false },
                expectedPurpose: 'deposit',
            }),
        ).toBe('confirmed');
    });

    it('fails a vault deposit cancelled by a self-transfer at the same nonce', () => {
        const cancellation = createTransaction({
            txid: 'cancellation',
            nonce: 7,
            data: '0x',
            targetAddress: accountDescriptor,
        });

        expect(
            getEvmPendingTxStatus({
                txid: 'deposit',
                trackedTransaction: { transaction: cancellation, isReplacement: true },
                expectedPurpose: 'deposit',
            }),
        ).toBe('failed');
    });

    it('fails a transaction that reverted on-chain', () => {
        const reverted = {
            ...createTransaction({ txid: 'deposit', nonce: 7, data: vaultDepositData }),
            type: 'failed',
        } as WalletAccountTransaction;

        expect(
            getEvmPendingTxStatus({
                txid: 'deposit',
                trackedTransaction: { transaction: reverted, isReplacement: false },
                expectedPurpose: 'deposit',
            }),
        ).toBe('failed');
    });

    it('resolves to no status without a tracked txid', () => {
        expect(getEvmPendingTxStatus({ txid: null, expectedPurpose: 'deposit' })).toBeNull();
    });
});

describe('Wrap and Unwrap pending transaction tracking', () => {
    const wrapCall = { to: wrappedNativeAddress, data: '0xd0e30db0', value: '42' };
    const unwrapCall = {
        to: wrappedNativeAddress,
        data: `0x2e1a7d4d${'2a'.padStart(64, '0')}`,
        value: '0',
    };
    const txid = 'original';

    it.each([
        ['wrap', wrapCall],
        ['unwrap', unwrapCall],
    ] as const)(
        'follows the original and successive matching replacements for %s',
        (purpose, expectedCall) => {
            const createMatchingTransaction = (hash: string, blockHeight: number) =>
                createTransaction({
                    txid: hash,
                    nonce: 7,
                    targetAddress: expectedCall.to.toUpperCase(),
                    data: expectedCall.data.toUpperCase(),
                    value: expectedCall.value,
                    blockHeight,
                });
            const original = createMatchingTransaction(txid, 0);
            const firstSpeedUp = createMatchingTransaction('first-speed-up', 0);
            const secondSpeedUp = createMatchingTransaction('second-speed-up', 0);

            const check = (
                transactions: WalletAccountTransaction[],
                expectedTxid: string,
                expectedStatus: string,
            ) => {
                const trackedTransaction = findTrackedEvmTransaction({
                    transactions,
                    txid,
                    nonce: 7,
                    expectedCall,
                });

                expect(
                    getTrackedWrappedNativeTxid({ txid, trackedTransaction, expectedCall }),
                ).toBe(expectedTxid);
                expect(
                    getEvmPendingTxStatus({
                        txid,
                        trackedTransaction,
                        expectedCall,
                        expectedPurpose: purpose,
                    }),
                ).toBe(expectedStatus);
            };

            check([original], txid, 'pending');
            check([createMatchingTransaction(txid, 1)], txid, 'confirmed');
            check([original, firstSpeedUp], firstSpeedUp.txid, 'pending');
            check([secondSpeedUp, firstSpeedUp], secondSpeedUp.txid, 'pending');
            check(
                [secondSpeedUp, createMatchingTransaction(firstSpeedUp.txid, 1)],
                firstSpeedUp.txid,
                'confirmed',
            );
            check(
                [createMatchingTransaction(secondSpeedUp.txid, 1)],
                secondSpeedUp.txid,
                'confirmed',
            );
        },
    );

    it.each([
        [
            'a cancellation',
            'wrap',
            wrapCall,
            { targetAddress: accountDescriptor, data: '0x', value: '0' },
        ],
        ['a different wrap amount', 'wrap', wrapCall, { value: '43' }],
        [
            'a different unwrap amount',
            'unwrap',
            unwrapCall,
            { data: `0x2e1a7d4d${'2b'.padStart(64, '0')}`, value: '0' },
        ],
        ['an unwrap carrying native value', 'unwrap', unwrapCall, { value: '1' }],
        ['a different destination', 'wrap', wrapCall, { targetAddress: vaultAddress }],
        ['a different method', 'wrap', wrapCall, { data: '0x12345678' }],
    ] as const)(
        'fails after mining %s even if the original still appears pending',
        (_, expectedPurpose, expectedCall, changes) => {
            const original = createTransaction({ txid, nonce: 7, blockHeight: 0 });
            const changedTx = createTransaction({
                txid: 'replacement',
                nonce: 7,
                data: expectedCall.data,
                value: '42',
                ...changes,
            });
            const trackedTransaction = findTrackedEvmTransaction({
                transactions: [original, changedTx],
                txid,
                nonce: 7,
                expectedCall,
            });

            expect(getTrackedWrappedNativeTxid({ txid, trackedTransaction, expectedCall })).toBe(
                txid,
            );
            expect(
                getEvmPendingTxStatus({ txid, trackedTransaction, expectedCall, expectedPurpose }),
            ).toBe('failed');
        },
    );

    it('keeps tracking the original while an unmatched replacement is pending', () => {
        const pendingCancel = createTransaction({
            txid: 'cancel',
            nonce: 7,
            data: '0x',
            targetAddress: accountDescriptor,
            blockHeight: 0,
        });
        const trackedTransaction = findTrackedEvmTransaction({
            transactions: [pendingCancel],
            txid,
            nonce: 7,
            expectedCall: wrapCall,
        });

        expect(
            getTrackedWrappedNativeTxid({ txid, trackedTransaction, expectedCall: wrapCall }),
        ).toBe(txid);
        expect(
            getEvmPendingTxStatus({
                txid,
                trackedTransaction,
                expectedCall: wrapCall,
                expectedPurpose: 'wrap',
            }),
        ).toBe('pending');
    });

    it('fails closed if the replacement call is unavailable', () => {
        const trackedTransaction = {
            transaction: createTransaction({ txid: 'replacement', nonce: 7 }),
            isReplacement: true,
        };

        expect(getEvmPendingTxStatus({ txid, trackedTransaction, expectedPurpose: 'wrap' })).toBe(
            'failed',
        );
    });
});
