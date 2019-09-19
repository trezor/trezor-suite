import { ROUTER } from '@suite-actions/constants';
import routerReducer from '../routerReducer';

describe('routerReducer', () => {
    it('wallet', () => {
        const state = routerReducer(undefined, {
            type: ROUTER.LOCATION_CHANGE,
            url: '/',
        });

        expect(state).toEqual({
            url: '/',
            pathname: '/',
            hash: undefined,
            params: {},
            app: 'wallet',
        });
    });

    it('wallet with hash params', () => {
        const state = routerReducer(undefined, {
            type: ROUTER.LOCATION_CHANGE,
            url: '/wallet/#/coin/1',
        });

        expect(state).toEqual({
            url: '/wallet/#/coin/1',
            pathname: '/wallet/',
            hash: '/coin/1',
            params: {
                symbol: 'coin',
                accountId: '1',
            },
            app: 'wallet',
        });
    });
});
