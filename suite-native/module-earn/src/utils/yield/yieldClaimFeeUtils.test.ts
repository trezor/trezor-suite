import { getYieldClaimFee } from './yieldClaimFeeUtils';
import { buildPreparedTxFeePreview } from '../earn/preparedTxFeeUtils';

const transaction = {
    from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    data: '0x1234',
    chainId: 1,
    gasLimit: '0x5208',
    nonce: 1,
};

describe('getYieldClaimFee', () => {
    it.each([
        {
            type: 'legacy',
            fields: { gasPrice: '0x3b9aca00' },
            expected: { gasLimit: '21000', gasPrice: '1000000000' },
        },
        {
            type: 'EIP-1559',
            fields: { maxFeePerGas: '0x77359400', maxPriorityFeePerGas: '0x3b9aca00' },
            expected: {
                gasLimit: '21000',
                maxFeePerGas: '2000000000',
                maxPriorityFeePerGas: '1000000000',
            },
        },
    ])('converts a shared $type preview to Claim signing units', ({ fields, expected }) => {
        const preview = buildPreparedTxFeePreview(JSON.stringify({ ...transaction, ...fields }));
        if (!preview) throw new Error('Expected a valid shared fee preview');

        expect(getYieldClaimFee(preview)).toEqual(expected);
    });
});
