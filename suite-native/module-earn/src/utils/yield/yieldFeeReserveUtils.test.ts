import { getYieldFeeReserveAlert } from './yieldFeeReserveUtils';

const gasReserve = { minimum: '0.002', recommended: '0.005' };

describe('getYieldFeeReserveAlert', () => {
    it('blocks with the minimum reserve when the native balance is insufficient', () => {
        expect(getYieldFeeReserveAlert({ nativeFeeStatus: 'insufficient', gasReserve })).toEqual({
            type: 'insufficient',
            amount: '0.002',
        });
    });

    it('recommends a top-up to the recommended reserve', () => {
        expect(
            getYieldFeeReserveAlert({ nativeFeeStatus: 'below-recommended', gasReserve }),
        ).toEqual({ type: 'top-up', amount: '0.005' });
    });

    it('shows nothing when the balance is sufficient', () => {
        expect(getYieldFeeReserveAlert({ nativeFeeStatus: 'sufficient', gasReserve })).toBeNull();
    });
});
