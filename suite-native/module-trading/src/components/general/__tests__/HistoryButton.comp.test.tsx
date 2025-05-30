import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { HistoryButton } from '../HistoryButton';

let mockSelectDeviceHasTradingTradesOfTradeTypeReturn: boolean;
let mockNavigate: jest.Mock;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectDeviceHasTradingTradesOfTradeType: () =>
        mockSelectDeviceHasTradingTradesOfTradeTypeReturn,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(() => ({
        navigate: mockNavigate,
    })),
}));

describe('HistoryButton', () => {
    const renderHistoryButton = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<HistoryButton tradeType="buy" />, {
            preloadedState,
        });

    it('should render nothing where no trades are available', async () => {
        mockSelectDeviceHasTradingTradesOfTradeTypeReturn = false;
        const { toJSON } = await renderHistoryButton({});

        expect(toJSON()).toBeNull();
    });

    describe('with trades available', () => {
        beforeEach(() => {
            mockSelectDeviceHasTradingTradesOfTradeTypeReturn = true;
            mockNavigate = jest.fn();
        });

        it('should render button when at least one trade is specified', async () => {
            const { getByText } = await renderHistoryButton({});

            expect(getByText('Trade history')).toBeOnTheScreen();
        });

        it('should render nothing when isAmountInputActive is true', async () => {
            const { toJSON } = await renderHistoryButton({
                wallet: {
                    tradingNew: {
                        isAmountInputActive: true,
                    },
                },
            });

            expect(toJSON()).toBeNull();
        });

        it('should navigate on press', async () => {
            const { getByText } = await renderHistoryButton({});

            fireEvent.press(getByText('Trade history'));

            expect(mockNavigate).toHaveBeenCalledWith('TradingHistory', {
                tradeType: 'buy',
            });
        });
    });
});
