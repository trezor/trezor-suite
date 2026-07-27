import { BigNumber } from '@trezor/utils';

import { buildUnstake } from '../../../../builder/evm/everstake/unstake';

describe('buildUnstake', () => {
    it('encodes valid unstake calldata', () => {
        const result = buildUnstake({
            value: new BigNumber('100000000000000000'),
            allowedInterchangeNum: new BigNumber(5),
            source: new BigNumber(1),
        });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x76ec871c000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000001',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero value', () => {
        const result = buildUnstake({
            value: new BigNumber(0),
            allowedInterchangeNum: new BigNumber(5),
            source: new BigNumber(1),
        });

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'value', severity: 'error' }]);
    });

    it('returns error when allowedInterchangeNum overflows uint16', () => {
        const result = buildUnstake({
            value: new BigNumber('100000000000000000'),
            allowedInterchangeNum: new BigNumber(70000),
            source: new BigNumber(1),
        });

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'EXCEEDS_UINT16', path: 'allowedInterchangeNum', severity: 'error' },
        ]);
    });

    it('returns INSUFFICIENT_BALANCE warning when value exceeds context balance', () => {
        const result = buildUnstake(
            {
                value: new BigNumber('200000000000000000'),
                allowedInterchangeNum: new BigNumber(5),
                source: new BigNumber(1),
            },
            { balance: 100000000000000000n },
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
            { code: 'INSUFFICIENT_BALANCE', path: 'value', severity: 'warning' },
        ]);
    });
});
