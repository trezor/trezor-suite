import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { RevokeLimitInfoRow } from '../RevokeLimitInfoRow';

describe('RevokeLimitInfoRow', () => {
    const renderRevokeLimitInfoRow = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(<RevokeLimitInfoRow />, {
            tradeType: 'exchange',
            overrides,
        });

    const withPreselectedQuote: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    preselectedQuote: {
                        ...mercuryoFixedWorstQuote,
                        preapprovedStringAmount: '100',
                    },
                },
            },
        },
    };

    it('should render that new limit is 0', () => {
        const { getByText } = renderRevokeLimitInfoRow(withPreselectedQuote);

        expect(getByText('0 USDC')).toBeOnTheScreen();
    });

    it('should display preapprovedStringAmount', () => {
        const { getByText } = renderRevokeLimitInfoRow(withPreselectedQuote);

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should render nothing when no quote is set', () => {
        const { toJSON } = renderRevokeLimitInfoRow();

        expect(toJSON()).toBeNull();
    });
});
