import { createBitcoinSendStrategy } from './createBitcoinSendStrategy';

describe('createBitcoinSendStrategy', () => {
    it('offers the example fee levels with the default first', () => {
        expect(createBitcoinSendStrategy().getFeeLevels()).toEqual([
            { id: 'economy', value: '1' },
            { id: 'normal', value: '5' },
            { id: 'high', value: '10' },
        ]);
    });
});
