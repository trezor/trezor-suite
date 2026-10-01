import { createSolanaSendStrategy } from './createSolanaSendStrategy';

describe('createSolanaSendStrategy', () => {
    it('offers the example fee levels with the default first', () => {
        expect(createSolanaSendStrategy().getFeeLevels()).toEqual([
            { id: 'none', value: '0' },
            { id: 'normal', value: '1000' },
            { id: 'high', value: '10000' },
        ]);
    });
});
