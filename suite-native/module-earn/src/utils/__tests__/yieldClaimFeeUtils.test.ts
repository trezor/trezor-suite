import { type FeeInfo, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';

import {
    buildYieldClaimFeeLevels,
    getYieldClaimFee,
    getYieldClaimUnsignedTransactionFee,
} from '../yieldClaimFeeUtils';

const feeInfo = {
    blockHeight: 1,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [
        {
            label: 'normal',
            blocks: 2,
            feePerUnit: '10',
            maxFeePerGas: '20',
            maxPriorityFeePerGas: '2',
        },
    ],
} satisfies FeeInfo;

describe('yieldClaimFeeUtils', () => {
    it('builds claim fee levels with claim gas limit', () => {
        const feeLevels = buildYieldClaimFeeLevels({
            availableBalance: '1000000000000000000',
            feeInfo,
            formDraft: undefined,
            gasLimit: '21000',
        });

        const normalFeeLevel = feeLevels.normal;

        expect(isFinalPrecomposedTransaction(normalFeeLevel)).toBe(true);

        if (!isFinalPrecomposedTransaction(normalFeeLevel)) {
            return;
        }

        expect(normalFeeLevel.fee).toBe('420000000000000');
        expect(normalFeeLevel.feeLimit).toBe('21000');
        expect(normalFeeLevel.maxFeePerGas).toBe('20');
        expect(normalFeeLevel.maxPriorityFeePerGas).toBe('2');
        expect(getYieldClaimFee(normalFeeLevel)).toEqual({
            gasLimit: '21000',
            maxFeePerGas: '20000000000',
            maxPriorityFeePerGas: '2000000000',
        });
    });

    it('returns a fee error when native balance cannot pay the claim fee', () => {
        const feeLevels = buildYieldClaimFeeLevels({
            availableBalance: '1',
            feeInfo,
            formDraft: undefined,
            gasLimit: '21000',
        });

        expect(feeLevels.normal?.type).toBe('error');
    });

    it('calculates maximum fee from unsigned claim transaction', () => {
        expect(
            getYieldClaimUnsignedTransactionFee({
                to: '0x0000000000000000000000000000000000000001',
                data: '0x1234',
                chainId: 1,
                gasLimit: '21000',
                maxFeePerGas: '20000000000',
                maxPriorityFeePerGas: '2000000000',
                nonce: '1',
            }),
        ).toBe('420000000000000');

        expect(
            getYieldClaimUnsignedTransactionFee({
                to: '0x0000000000000000000000000000000000000001',
                data: '0x1234',
                chainId: 1,
                gasLimit: '21000',
                gasPrice: '1000000000',
                nonce: '1',
            }),
        ).toBe('21000000000000');
    });
});
