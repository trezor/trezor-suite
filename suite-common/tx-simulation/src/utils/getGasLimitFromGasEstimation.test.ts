import { getGasLimitFromGasEstimation } from './getGasLimitFromGasEstimation';

const getSuccessfulEstimation = (estimate: string) =>
    ({ status: 'Success', estimate, used: estimate }) as const;

describe('getGasLimitFromGasEstimation', () => {
    it.each([
        ['decimal', '50000', '0xc350'],
        ['hex', '0xc350', '0xc350'],
        ['maximum', '4294967295', '0xffffffff'],
    ])('returns a hex gas limit for a %s estimate', (_, estimate, expected) => {
        expect(getGasLimitFromGasEstimation(getSuccessfulEstimation(estimate))).toBe(expected);
    });

    it.each([
        ['zero', '0'],
        ['empty', ''],
        ['above the simulation gas limit', '4294967296'],
        ['negative', '-1'],
        ['fraction', '1.5'],
        ['exponent', '5e4'],
        ['text', 'unknown'],
    ])('returns null for a %s estimate', (_, estimate) => {
        expect(getGasLimitFromGasEstimation(getSuccessfulEstimation(estimate))).toBeNull();
    });

    it('returns null for a failed estimation', () => {
        expect(getGasLimitFromGasEstimation({ status: 'Error', error: 'reverted' })).toBeNull();
    });

    it('returns null for a missing estimation', () => {
        expect(getGasLimitFromGasEstimation(undefined)).toBeNull();
    });
});
