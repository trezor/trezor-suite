import { getTradingFormDraftFeeLimit } from './getTradingFormDraftFeeLimit';

describe('getTradingFormDraftFeeLimit', () => {
    it('uses the estimated fee limit in SUN for TRON', () => {
        expect(
            getTradingFormDraftFeeLimit({
                networkType: 'tron',
                fee: '13028500',
                feeLimit: '130285',
                estimatedFeeLimit: '13028500',
            }),
        ).toBe('13028500');
    });

    it('falls back to the fee in SUN for TRON', () => {
        expect(
            getTradingFormDraftFeeLimit({
                networkType: 'tron',
                fee: '13028500',
                feeLimit: '130285',
            }),
        ).toBe('13028500');
    });

    it('uses the fee limit for other networks', () => {
        expect(
            getTradingFormDraftFeeLimit({
                networkType: 'ethereum',
                fee: '109200000000000',
                feeLimit: '21000',
                estimatedFeeLimit: '22000',
            }),
        ).toBe('21000');
    });
});
