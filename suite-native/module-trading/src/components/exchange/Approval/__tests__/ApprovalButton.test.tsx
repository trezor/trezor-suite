import { tradingExchangeActions } from '@suite-common/trading';
import {
    TestStore,
    initStore,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ApprovalButton } from '../ApprovalButton';

const mockNavigate = jest.fn();
const mockConfirmTrade = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock('../../../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
    }),
}));

describe('ApprovalButton', () => {
    let store: TestStore;

    const renderApprovalButton = () => renderWithStoreProviderAsync(<ApprovalButton />, { store });

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfirmTrade.mockResolvedValue(true);

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];
        store = initStore(preloadedState).store;
    });

    it('should render continue button', async () => {
        const { getByText } = await renderApprovalButton();

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should confirmTrade and navigate to TradingExchangePreview on press', async () => {
        const { getByText } = await renderApprovalButton();

        await userEvent.press(getByText('Continue'));

        expect(mockConfirmTrade).toHaveBeenCalledWith({
            receiveAddress: '',
            trade: exchangeQuotes[0],
            approvalFlow: true,
            nextStep: expect.any(Function),
        });

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangePreview', { isApproved: true });
    });

    it('should render nothing when no preselected quote is provided', async () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));

        const { toJSON } = await renderApprovalButton();

        expect(toJSON()).toBeNull();
    });
});
