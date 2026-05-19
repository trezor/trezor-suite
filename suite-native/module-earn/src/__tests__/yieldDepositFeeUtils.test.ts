import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';

const baseUnsignedTransaction = {
    from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    to: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa',
    data: '0x6e553f65',
    chainId: 1,
    gasLimit: '0x5208',
    nonce: 1,
    value: '0x0',
};

describe('buildYieldDepositFeePreview', () => {
    it('builds an EIP-1559 maximum fee preview from backend transaction', () => {
        const result = buildYieldDepositFeePreview(
            JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                maxFeePerGas: '0x3b9aca00',
                maxPriorityFeePerGas: '0x1dcd6500',
            }),
        );

        expect(result).toMatchObject({
            type: 'final',
            fee: '21000000000000',
            feePerByte: '1',
            feeLimit: '21000',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        });
    });

    it('builds a legacy gas price fee preview from backend transaction', () => {
        const result = buildYieldDepositFeePreview(
            JSON.stringify({
                ...baseUnsignedTransaction,
                gasPrice: '0x59682f00',
            }),
        );

        expect(result).toMatchObject({
            type: 'final',
            fee: '31500000000000',
            feePerByte: '1.5',
            feeLimit: '21000',
        });
    });

    it('returns null for unsupported unsigned transaction payload', () => {
        expect(buildYieldDepositFeePreview('not-json')).toBeNull();
    });

    it('returns null when the backend transaction has no fee fields', () => {
        expect(buildYieldDepositFeePreview(JSON.stringify(baseUnsignedTransaction))).toBeNull();
    });
});
