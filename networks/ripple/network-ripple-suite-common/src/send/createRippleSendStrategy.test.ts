import { createRippleSendStrategy } from './createRippleSendStrategy';

describe('createRippleSendStrategy', () => {
    it('offers the example fee levels with the default first', () => {
        expect(createRippleSendStrategy().getFeeLevels()).toEqual([{ id: 'normal', value: '12' }]);
    });
});
