import { SOL_COMPUTE_UNIT_LIMIT, SOL_COMPUTE_UNIT_PRICE } from '../constants';
import { getStakingParams } from './stakingUtils';

describe('getStakingParams', () => {
    it('uses the default compute budget when no fee estimate is available', () => {
        expect(getStakingParams()).toEqual({
            computeUnitPrice: BigInt(SOL_COMPUTE_UNIT_PRICE),
            computeUnitLimit: SOL_COMPUTE_UNIT_LIMIT,
        });
    });

    it.each<[string, bigint]>([
        ['300000', 300000n],
        ['300000.0', 300000n],
        ['300000.25', 300001n],
        ['3e+5', 300000n],
        ['1e-3', 1n],
        ['0', 0n],
        ['9007199254740993', 9007199254740993n],
        ['18446744073709551615', 18446744073709551615n],
    ])('encodes fee rate %s as an integer micro-lamport price', (feePerUnit, expected) => {
        expect(getStakingParams({ feePerUnit, feeLimit: '200000' })).toEqual({
            computeUnitPrice: expected,
            computeUnitLimit: 200000,
        });
    });

    it.each(['NaN', '-1', '18446744073709551616'])(
        'rejects invalid fee rate %s without a BigInt parsing exception',
        feePerUnit => {
            expect(getStakingParams({ feePerUnit, feeLimit: '200000' })).toBeUndefined();
        },
    );

    it('accepts an exact compute unit limit in exponential notation', () => {
        expect(getStakingParams({ feePerUnit: '300000', feeLimit: '2e5' })).toEqual({
            computeUnitPrice: 300000n,
            computeUnitLimit: 200000,
        });
    });

    it.each([{ feePerUnit: 'NaN' }, { feePerUnit: '', feeLimit: '200000' }])(
        'rejects an incomplete fee estimate %j',
        estimatedFee => {
            expect(getStakingParams(estimatedFee)).toBeUndefined();
        },
    );

    it.each(['0', '200000.00000000001', '4294967296'])(
        'rejects invalid compute unit limit %s',
        feeLimit => {
            expect(getStakingParams({ feePerUnit: '300000', feeLimit })).toBeUndefined();
        },
    );
});
