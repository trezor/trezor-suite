import { getWrappedNativeAddress } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    findTrackedWrappedNativeTransaction,
    getWrappedNativePendingTxStatus,
} from '../useWrappedNativePendingTx';

const wrappedNativeAddress = getWrappedNativeAddress('eth')!;

const createTransaction = ({
    txid,
    nonce,
    data = '0xd0e30db0',
    blockHeight = 1,
}: {
    txid: string;
    nonce: number;
    data?: string;
    blockHeight?: number;
}) =>
    ({
        txid,
        symbol: 'eth',
        type: 'sent',
        blockHeight,
        targets: [{ addresses: [wrappedNativeAddress] }],
        internalTransfers: [],
        ethereumSpecific: {
            nonce,
            data,
            status: blockHeight > 0 ? 1 : -1,
        },
    }) as unknown as WalletAccountTransaction;

describe('wrapped native pending transaction tracking', () => {
    it('finds a replacement by its EVM nonce after the original txid disappears', () => {
        const replacement = createTransaction({ txid: 'replacement', nonce: 7 });

        expect(
            findTrackedWrappedNativeTransaction({
                transactions: [replacement],
                txid: 'original',
                nonce: 7,
            }),
        ).toEqual({ transaction: replacement, isReplacement: true });
    });

    it('confirms a replacement that preserves the wrapped-native operation', () => {
        const replacement = createTransaction({ txid: 'replacement', nonce: 7 });

        expect(
            getWrappedNativePendingTxStatus({
                txid: 'original',
                trackedTransaction: { transaction: replacement, isReplacement: true },
                flowType: 'wrap',
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
            getWrappedNativePendingTxStatus({
                txid: 'original',
                trackedTransaction: { transaction: cancellation, isReplacement: true },
                flowType: 'wrap',
            }),
        ).toBe('failed');
    });
});
