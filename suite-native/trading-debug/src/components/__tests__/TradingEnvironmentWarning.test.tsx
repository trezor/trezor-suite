// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProvider } from '@suite-native/test-utils/store';
import { tradingInitialState } from '@suite-native/trading-consts';
import type { TradingState } from '@suite-native/trading-types';

import { TradingEnvironmentWarning } from '../TradingEnvironmentWarning';

describe('TradingEnvironmentWarning', () => {
    const renderTradingEnvironmentWarning = (
        tradingEnvironment: TradingState['tradingEnvironment'],
    ) =>
        renderWithStoreProvider(<TradingEnvironmentWarning />, {
            preloadedState: {
                wallet: {
                    trading: {
                        ...tradingInitialState,
                        tradingEnvironment,
                    },
                },
            },
        });

    it('should render nothing when tradingEnvironment is [production]', () => {
        const { toJSON } = renderTradingEnvironmentWarning('production');

        expect(toJSON()).toBeNull();
    });

    it.each<TradingState['tradingEnvironment']>(['staging', 'dev', 'localhost'])(
        'should render warning for tradingEnvironment [%s]',
        tradingEnvironment => {
            const { getByText } = renderTradingEnvironmentWarning(tradingEnvironment);

            expect(getByText(`Trading environment: ${tradingEnvironment}`)).toBeOnTheScreen();
        },
    );
});
