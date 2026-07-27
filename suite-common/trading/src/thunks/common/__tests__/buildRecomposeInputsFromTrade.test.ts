import { ETHEREUM_ADJUST_GAS_LIMIT } from '@suite-common/wallet-core';

import { buildRecomposeInputsFromTrade } from '../buildRecomposeInputsFromTrade';

const dexTx = {
    from: '0xSender',
    to: '0xSwapContract',
    value: '1000000000000000000',
    data: '0xdeadbeef',
};

describe('buildRecomposeInputsFromTrade', () => {
    describe('sendAddress input', () => {
        it('returns address, amount, destinationTag without sats conversion', () => {
            const result = buildRecomposeInputsFromTrade({
                sendAddress: '0xSendAddr',
                sendStringAmount: '1.5',
                partnerPaymentExtraId: 'memo-cex',
                shouldSendInSats: false,
                decimals: 8,
            });

            expect(result).toEqual({
                address: '0xSendAddr',
                amount: '1.5',
                destinationTag: 'memo-cex',
            });
        });

        it('converts amount to sats when shouldSendInSats is true', () => {
            const result = buildRecomposeInputsFromTrade({
                sendAddress: '0xSendAddr',
                sendStringAmount: '1.5',
                partnerPaymentExtraId: 'memo-cex',
                shouldSendInSats: true,
                decimals: 8,
            });

            expect(result.amount).toBe('150000000');
        });

        it('uses provided decimals when converting amount to subunits', () => {
            const result = buildRecomposeInputsFromTrade({
                sendAddress: '0xSendAddr',
                sendStringAmount: '1.234567890123456789',
                partnerPaymentExtraId: 'memo-cex',
                shouldSendInSats: true,
                decimals: 18,
            });

            expect(result.amount).toBe('1234567890123456789');
        });

        it('treats shouldSendInSats=undefined as false', () => {
            const result = buildRecomposeInputsFromTrade({
                sendAddress: '0xSendAddr',
                sendStringAmount: '1.5',
                partnerPaymentExtraId: 'memo-cex',
                shouldSendInSats: undefined,
                decimals: 8,
            });

            expect(result.amount).toBe('1.5');
        });

        it('does not set DEX-only fields', () => {
            const result = buildRecomposeInputsFromTrade({
                sendAddress: '0xSendAddr',
                sendStringAmount: '1.5',
                partnerPaymentExtraId: 'memo-cex',
                shouldSendInSats: false,
                decimals: 8,
            });

            expect(result.transactionData).toBeUndefined();
            expect(result.ethereumAdjustGasLimit).toBeUndefined();
            expect(result.recalculateCustomLimit).toBeUndefined();
        });
    });

    describe('dexTx input', () => {
        it('returns dexTx.to/value, destinationTag, DEX-only fields', () => {
            const result = buildRecomposeInputsFromTrade({
                dexTx,
                partnerPaymentExtraId: 'memo-dex',
                serializedTx: '0xabcd',
            });

            expect(result).toEqual({
                address: '0xSwapContract',
                amount: '1000000000000000000',
                destinationTag: 'memo-dex',
                transactionData: '0xabcd',
                ethereumAdjustGasLimit: ETHEREUM_ADJUST_GAS_LIMIT,
                recalculateCustomLimit: true,
            });
        });

        it('forwards undefined serializedTx without synthesizing a default', () => {
            const result = buildRecomposeInputsFromTrade({
                dexTx,
                partnerPaymentExtraId: 'memo-dex',
                serializedTx: undefined,
            });

            expect(result.transactionData).toBeUndefined();
        });
    });

    describe('destinationAddress input', () => {
        it('returns destinationAddress, amount, destinationTag without sats conversion', () => {
            const result = buildRecomposeInputsFromTrade({
                destinationAddress: 'bc1qDest',
                cryptoStringAmount: '0.25',
                destinationPaymentExtraId: 'memo-sell',
                shouldSendInSats: false,
                decimals: 8,
            });

            expect(result).toEqual({
                address: 'bc1qDest',
                amount: '0.25',
                destinationTag: 'memo-sell',
            });
        });

        it('converts amount to sats when shouldSendInSats is true', () => {
            const result = buildRecomposeInputsFromTrade({
                destinationAddress: 'bc1qDest',
                cryptoStringAmount: '0.25',
                destinationPaymentExtraId: 'memo-sell',
                shouldSendInSats: true,
                decimals: 8,
            });

            expect(result.amount).toBe('25000000');
        });

        it('does not set DEX-only fields', () => {
            const result = buildRecomposeInputsFromTrade({
                destinationAddress: 'bc1qDest',
                cryptoStringAmount: '0.25',
                destinationPaymentExtraId: 'memo-sell',
                shouldSendInSats: false,
                decimals: 8,
            });

            expect(result.transactionData).toBeUndefined();
            expect(result.ethereumAdjustGasLimit).toBeUndefined();
            expect(result.recalculateCustomLimit).toBeUndefined();
        });
    });
});
