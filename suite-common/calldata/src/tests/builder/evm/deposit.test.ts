import { BigNumber } from '@trezor/utils';

import { buildDeposit } from '../../../builder/evm/deposit';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');

describe('buildDeposit', () => {
    it('encodes valid deposit calldata', () => {
        const result = buildDeposit(
            {
                assets: new BigNumber('5000000'),
                receiver: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x6e553f6500000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero address receiver', () => {
        const result = buildDeposit(
            {
                assets: new BigNumber('5000000'),
                receiver: '0x0000000000000000000000000000000000000000',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'ZERO_ADDRESS', path: 'receiver', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
    });

    it('returns error when receiver is different from sender', () => {
        const result = buildDeposit(
            {
                assets: new BigNumber('5000000'),
                receiver: '0x1111111111111111111111111111111111111111',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
    });

    it('returns error for zero assets', () => {
        const result = buildDeposit(
            {
                assets: new BigNumber('0'),
                receiver: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'assets', severity: 'error' }]);
    });
});
