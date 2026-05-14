import { type TradingTransaction } from '@suite-common/trading';
import { fireEvent } from '@suite-native/test-utils-store';
import { getBuyTrade } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { HistoryButton } from '../HistoryButton';

let mockSelectDeviceTradingTrades: TradingTransaction[];
let mockNavigate: jest.Mock;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectDeviceTradingTrades: () => mockSelectDeviceTradingTrades,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(() => ({
        navigate: mockNavigate,
    })),
}));

describe('HistoryButton', () => {
    const renderHistoryButton = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(<HistoryButton />, {
            overrides,
        });

    it('should render nothing where no trades are available', () => {
        mockSelectDeviceTradingTrades = [];
        const { toJSON } = renderHistoryButton({});

        expect(toJSON()).toBeNull();
    });

    describe('with trades available', () => {
        beforeEach(() => {
            mockSelectDeviceTradingTrades = [getBuyTrade({ status: 'SUBMITTED' })];
            mockNavigate = jest.fn();
        });

        it('should render button when at least one trade is specified', () => {
            const { getByText } = renderHistoryButton({});

            expect(getByText('Trade history')).toBeOnTheScreen();
        });

        it('should render nothing when isAmountInputActive is true', () => {
            const { toJSON } = renderHistoryButton({
                wallet: {
                    trading: {
                        isAmountInputActive: true,
                    },
                },
            });

            expect(toJSON()).toBeNull();
        });

        it('should navigate on press', () => {
            const { getByText } = renderHistoryButton({});

            fireEvent.press(getByText('Trade history'));

            expect(mockNavigate).toHaveBeenCalledWith('TradingHistory');
        });
    });
});
