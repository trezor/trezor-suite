import type { Payment, TransactionMetadata, TrustSet } from 'xrpl';

import { transformRippleTransaction } from './accountTransactions';

// Example addresses from the XRPL documentation.
const SENDER = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn';
const RECIPIENT = 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX';
const TX_HASH = 'C53ECF838647FA5A4C780377025FEC7999AB4182590510CA461444B207AB74A9';
const XRPL_DATE = 500_000_000;
const UNIX_DATE = XRPL_DATE + 946_684_800;

const mockPayment = (overrides: Partial<Payment> = {}): Payment => ({
    TransactionType: 'Payment',
    Account: SENDER,
    Destination: RECIPIENT,
    Amount: '1000000',
    DeliverMax: '1000000',
    DestinationTag: 42,
    Fee: '12',
    date: XRPL_DATE,
    ledger_index: 123456,
    ...overrides,
});

const mockMeta = (transactionResult: string): TransactionMetadata => ({
    AffectedNodes: [],
    TransactionIndex: 0,
    TransactionResult: transactionResult,
});

describe(transformRippleTransaction.name, () => {
    it('transforms a sent XRP payment', () => {
        expect(
            transformRippleTransaction(TX_HASH, mockPayment(), mockMeta('tesSUCCESS'), SENDER),
        ).toEqual({
            type: 'sent',
            txid: TX_HASH,
            amount: '1000000',
            fee: '12',
            blockTime: UNIX_DATE,
            blockHeight: 123456,
            blockHash: TX_HASH,
            targets: [{ addresses: [RECIPIENT], isAddress: true, amount: '1000000', n: 0 }],
            tokens: [],
            internalTransfers: [],
            feeRate: undefined,
            details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
            rippleSpecific: { destinationTag: 42 },
        });
    });

    it('marks a payment to the descriptor as received', () => {
        const tx = transformRippleTransaction(
            TX_HASH,
            mockPayment(),
            mockMeta('tesSUCCESS'),
            RECIPIENT,
        );

        expect(tx.type).toBe('recv');
        expect(tx.targets).toEqual([
            { addresses: [RECIPIENT], isAddress: true, amount: '1000000', n: 0 },
        ]);
    });

    it('classifies a payment without metadata by the descriptor', () => {
        expect(transformRippleTransaction(TX_HASH, mockPayment(), undefined, SENDER).type).toBe(
            'sent',
        );
    });

    it('marks a payment with a non-tes result as failed', () => {
        const tx = transformRippleTransaction(
            TX_HASH,
            mockPayment(),
            mockMeta('tecUNFUNDED_PAYMENT'),
            SENDER,
        );

        expect(tx.type).toBe('failed');
        expect(tx.fee).toBe('12');
    });

    it('returns an unknown transaction without targets for a token payment', () => {
        const tokenAmount = { currency: 'USD', issuer: RECIPIENT, value: '10' };
        const tx = transformRippleTransaction(
            TX_HASH,
            mockPayment({ Amount: tokenAmount, DeliverMax: tokenAmount }),
            mockMeta('tesSUCCESS'),
            SENDER,
        );

        expect(tx).toMatchObject({ type: 'unknown', amount: '0', targets: [] });
    });

    it('returns an unknown transaction without targets when no descriptor is given', () => {
        expect(
            transformRippleTransaction(TX_HASH, mockPayment(), mockMeta('tesSUCCESS')),
        ).toMatchObject({ type: 'unknown', targets: [] });
    });

    it('returns an unknown transaction for a non-payment transaction', () => {
        const trustSet: TrustSet = {
            TransactionType: 'TrustSet',
            Account: SENDER,
            LimitAmount: { currency: 'USD', issuer: RECIPIENT, value: '100' },
            Fee: '15',
        };

        expect(
            transformRippleTransaction(TX_HASH, trustSet, mockMeta('tesSUCCESS'), SENDER),
        ).toMatchObject({
            type: 'unknown',
            amount: '0',
            fee: '15',
            blockTime: 0,
            targets: [],
            rippleSpecific: { destinationTag: undefined },
        });
    });

    it('falls back to empty identifiers when the hash is missing', () => {
        expect(
            transformRippleTransaction(undefined, mockPayment(), mockMeta('tesSUCCESS'), SENDER),
        ).toMatchObject({ txid: '', blockHash: '' });
    });
});
