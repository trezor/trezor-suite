import { type FeeInfo } from '@suite-common/wallet-types';

import { feeInfoEip1559, feeInfoLegacy } from './__fixtures__/evmFixtures';
import { getEthereumRbfFeeInfo } from './sendFormEthereumThunks';

const buildFeeInfo = (levels: FeeInfo['levels']): FeeInfo => ({
    blockHeight: 0,
    blockTime: 15,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels,
});

describe('getEthereumRbfFeeInfo', () => {
    it('bumps EIP-1559 fees by the speed-up multiplier using the network high level', () => {
        // max(original 25, high 30) * 1.2 = 36 ; max(original 2.5, high 3) * 1.2 = 3.6
        const result = getEthereumRbfFeeInfo(feeInfoEip1559, {
            maxFeePerGas: '25',
            maxPriorityFeePerGas: '2.5',
        });

        expect(result.levels).toHaveLength(1);
        const level = result.levels[0];
        if (!level) throw new Error('expected a fee level');
        expect(level.label).toBe('normal');
        expect(level.maxFeePerGas).toBe('36');
        expect(level.maxPriorityFeePerGas).toBe('3.6');
    });

    it('uses the original gas when it exceeds the network high level', () => {
        const result = getEthereumRbfFeeInfo(feeInfoEip1559, {
            maxFeePerGas: '50',
            maxPriorityFeePerGas: '10',
        });

        const level = result.levels[0];
        if (!level) throw new Error('expected a fee level');
        expect(level.maxFeePerGas).toBe('60'); // 50 * 1.2
        expect(level.maxPriorityFeePerGas).toBe('12'); // 10 * 1.2
    });

    it('guarantees at least a 10% bump over the original (EIP-1559)', () => {
        const level = getEthereumRbfFeeInfo(feeInfoEip1559, {
            maxFeePerGas: '40',
            maxPriorityFeePerGas: '4',
        }).levels[0];
        if (!level) throw new Error('expected a fee level');

        expect(Number(level.maxFeePerGas)).toBeGreaterThanOrEqual(40 * 1.1);
        expect(Number(level.maxPriorityFeePerGas)).toBeGreaterThanOrEqual(4 * 1.1);
    });

    it('bumps a legacy gas price above the original', () => {
        // fee = max(network feePerUnit 20, originalGasPrice 100 + minFee 1) = 101
        const result = getEthereumRbfFeeInfo(feeInfoLegacy, { gasPrice: '100' });

        expect(result.levels.every(level => level.feePerUnit === '101')).toBe(true);
        expect(result.minFee).toBe(101);
    });

    it('returns the fee info unchanged when there are no levels', () => {
        const empty = { ...feeInfoEip1559, levels: [] };

        expect(getEthereumRbfFeeInfo(empty, { maxFeePerGas: '10' })).toBe(empty);
    });

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
