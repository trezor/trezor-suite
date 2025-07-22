import { tradingSettingsActions, tradingSettingsReducer } from '../settingsReducer';

describe('tradingSettingsSlice', () => {
    it('should have correct initial state', () => {
        const state = tradingSettingsReducer(undefined, { type: 'unknown_action' });

        expect(state).toEqual({
            maxSlippagePercentage: '1',
        });
    });

    describe('setMaxSlippagePercentage', () => {
        it('should set max slippage', () => {
            const state = tradingSettingsReducer(
                undefined,
                tradingSettingsActions.setMaxSlippagePercentage('2'),
            );

            expect(state.maxSlippagePercentage).toBe('2');
        });
    });
});
