import { initialState } from '../../reducers/tradingReducer';
import { TradingRootState } from '../../types';
import { selectTradingMaxSlippagePercentage } from '../settingsSelectors';

describe('settingsSelectors', () => {
    const getInitialState = (): TradingRootState => ({
        wallet: {
            trading: {
                ...initialState,
            },
        },
    });

    describe('selectTradingMaxSlippagePercentage', () => {
        it('should return exchange.maxSlippagePercentage', () => {
            expect(selectTradingMaxSlippagePercentage(getInitialState())).toEqual('1');
        });

        it('should return "1" even when state is undefined', () => {
            const state = getInitialState();
            // @ts-expect-error - undefined state (can happen e.g. after upgrade from old version)
            state.wallet.trading.settings.maxSlippagePercentage = undefined;

            expect(selectTradingMaxSlippagePercentage(getInitialState())).toEqual('1');
        });
    });
});
