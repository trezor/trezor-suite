import type { AccountTxTransaction } from '@trezor/network-ripple/types';

import { transformTransaction } from './ripple';

const descriptor = 'rDESTINATIONaccount000000000000000';

const paymentTxJson = {
    TransactionType: 'Payment',
    Account: 'rSENDER00000000000000000000000000',
    Destination: descriptor,
    DeliverMax: '1000000',
    Fee: '10',
    date: 700000000,
    ledger_index: 12345,
} as unknown as NonNullable<AccountTxTransaction['tx_json']>;

describe('ripple/utils', () => {
    describe('transformTransaction poison-record DoS resistance', () => {
        it('does not throw when untrusted meta.TransactionResult is a non-string, and treats it as failed', () => {
            // Malicious/malformed xrpl backend returns TransactionResult as a number.
            // Optional chaining does not guard non-string truthy values, so .startsWith
            // would throw "not a function" and abort the whole-history flatMap.
            const poisonMeta = {
                TransactionResult: 123,
            } as unknown as AccountTxTransaction['meta'];

            let result: ReturnType<typeof transformTransaction> | undefined;
            expect(() => {
                result = transformTransaction('hash1', paymentTxJson, poisonMeta, descriptor);
            }).not.toThrow();

            // A non-"tes" (here non-string) result must be classified as failed, matching
            // the behaviour for a legitimate non-"tes" string result.
            expect(result?.type).toBe('failed');
        });

        it('still classifies a successful tesSUCCESS payment as sent', () => {
            const okMeta = { TransactionResult: 'tesSUCCESS' } as AccountTxTransaction['meta'];

            const result = transformTransaction('hash2', paymentTxJson, okMeta, descriptor);

            // Account !== descriptor so this is a received payment.
            expect(result.type).toBe('recv');
        });

        it('classifies a non-tes string result as failed', () => {
            const failMeta = {
                TransactionResult: 'tecUNFUNDED_PAYMENT',
            } as AccountTxTransaction['meta'];

            const result = transformTransaction('hash3', paymentTxJson, failMeta, descriptor);

            expect(result.type).toBe('failed');
        });
    });
});
