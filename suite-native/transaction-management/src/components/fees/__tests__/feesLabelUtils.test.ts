import { getFeeLabelTranslationId } from '../feesLabelUtils';

describe('getFeeLabelTranslationId', () => {
    it('should return ethereum translation key for ethereum network', () => {
        expect(getFeeLabelTranslationId('ethereum')).toBe(
            'transactionManagement.fees.description.title.ethereum',
        );
    });

    it('should return general translation key for non-ethereum networks', () => {
        expect(getFeeLabelTranslationId('bitcoin')).toBe(
            'transactionManagement.fees.description.title.general',
        );
    });
});
