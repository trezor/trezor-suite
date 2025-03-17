import { regional } from '../regional';

describe('Regional', () => {
    describe('isInEEA', () => {
        it('should test when country is in EEA', () => {
            const isIn = regional.isInEEA('DE');

            expect(isIn).toBe(true);
        });

        it('should test when country is not in EEA', () => {
            const isIn = regional.isInEEA('test');

            expect(isIn).toBe(false);
        });
    });
});
