import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';
import { getBuyTrade } from '@suite-native/trading-fixtures';

import { HistoryButton } from './HistoryButton';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

let mockSelectDeviceTradingTrades: TradingTransaction[];
let mockNavigate: jest.Mock;
let mockIsFocused = true;
const mockUseWatchAllTrades = jest.fn((_props: { isEnabled: boolean }) => ({
    totalTrades: mockSelectDeviceTradingTrades.length,
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectDeviceTradingTrades: () => mockSelectDeviceTradingTrades,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
    useNavigation: jest.fn(() => ({
        navigate: mockNavigate,
    })),
}));

jest.mock('../../hooks/general/useWatchAllTrades', () => ({
    useWatchAllTrades: (props: { isEnabled: boolean }) => mockUseWatchAllTrades(props),
}));

describe('HistoryButton', () => {
    beforeEach(() => {
        mockIsFocused = true;
    });

    const renderHistoryButton = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(<HistoryButton />, {
            overrides,
        });

    it('should render nothing where no trades are available', async () => {
        mockSelectDeviceTradingTrades = [];
        const { toJSON } = await renderHistoryButton({});

        expect(toJSON()).toBeNull();
    });

    describe('with trades available', () => {
        beforeEach(() => {
            mockSelectDeviceTradingTrades = [getBuyTrade({ status: 'SUBMITTED' })];
            mockNavigate = jest.fn();
        });

        it('should render button when at least one trade is specified', async () => {
            const { getByText } = await renderHistoryButton({});

            expect(
                getByText(getTranslation('moduleTrading.tradeHistory.list.title')),
            ).toBeOnTheScreen();
        });

        it('should disable trade watching when the screen is not focused', async () => {
            mockIsFocused = false;

            await renderHistoryButton({});

            expect(mockUseWatchAllTrades).toHaveBeenCalledWith({ isEnabled: false });
        });

        it('should render nothing when isAmountInputActive is true', async () => {
            const { toJSON } = await renderHistoryButton({
                wallet: {
                    trading: {
                        isAmountInputActive: true,
                    },
                },
            });

            expect(toJSON()).toBeNull();
        });

        it('should navigate on press', async () => {
            const { getByText } = await renderHistoryButton({});

            await fireEvent.press(
                getByText(getTranslation('moduleTrading.tradeHistory.list.title')),
            );

            expect(mockNavigate).toHaveBeenCalledWith('TradingHistory');
        });
    });
});
