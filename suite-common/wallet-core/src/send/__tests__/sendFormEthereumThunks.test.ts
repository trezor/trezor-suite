import { type FeeInfo } from '@suite-common/wallet-types';

import { getEthereumRbfFeeInfo } from '../sendFormEthereumThunks';

const buildFeeInfo = (levels: FeeInfo['levels']): FeeInfo => ({
    blockHeight: 0,
    blockTime: 15,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels,
});

describe('getEthereumRbfFeeInfo', () => {
    it('caps the EIP-1559 bumped fee at 9 Gwei decimal places', () => {
        // 2.319686957 (9 decimals) * 1.2 = 2.7836243484 (10 decimals), which is not a
        // representable Gwei value (1 Gwei = 1e9 Wei) and previously blew up downstream
        // when converted to Wei.
        const feeInfo = buildFeeInfo([
            {
                label: 'high',
                feePerUnit: '2.319686957',
                maxFeePerGas: '2.319686957',
                maxPriorityFeePerGas: '0.100000001',
                feeLimit: '21000',
                blocks: 1,
            },
        ]);

        const result = getEthereumRbfFeeInfo(feeInfo, {
            maxFeePerGas: '1.5',
            maxPriorityFeePerGas: '0.05',
        });

        const level = result.levels[0];
        expect(level).toBeDefined();
        expect(level?.maxFeePerGas).toBe('2.783624349');
        expect(level?.maxFeePerGas?.split('.')[1]).toHaveLength(9);
        expect(level?.maxPriorityFeePerGas?.split('.')[1]?.length).toBeLessThanOrEqual(9);
    });

    it('leaves already-valid Gwei values untouched', () => {
        const feeInfo = buildFeeInfo([
            {
                label: 'high',
                feePerUnit: '2',
                maxFeePerGas: '2',
                maxPriorityFeePerGas: '0.1',
                feeLimit: '21000',
                blocks: 1,
            },
        ]);

        const result = getEthereumRbfFeeInfo(feeInfo, {
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.05',
        });

        const level = result.levels[0];
        expect(level).toBeDefined();
        expect(level?.maxFeePerGas).toBe('2.4');
        expect(level?.maxPriorityFeePerGas).toBe('0.12');
    });
});
