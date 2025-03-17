import { InvityServerEnvironment } from '@suite-common/trading';

import { initialState } from '../../tradingSlice';
import { selectTradingEnvironment } from '../commonSelectors';

describe('commonSelectors', () => {
    describe('selectTradingEnvironment', () => {
        it('should correctly select trading environment', () => {
            const state = {
                ...initialState,
                tradingEnvironment: 'staging' as InvityServerEnvironment,
            };

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('staging');
        });
    });
});
