import { tradingExchangeActions } from '@suite-common/trading';
import { AccountKey } from '@suite-common/wallet-types';
import { userEvent } from '@suite-native/test-utils';
import { type TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ApprovalButton, ApprovalButtonProps } from '../ApprovalButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ApprovalButton', () => {
    let store: TestStore;

    const renderApprovalButton = (props: ApprovalButtonProps) =>
        renderWithStoreProviderAsync(<ApprovalButton {...props} />, { store });

    beforeEach(() => {
        jest.clearAllMocks();

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey =
            'eth-account-1' as AccountKey;
        store = initStore(preloadedState).store;
    });

    it('should render continue button when isReady is true', async () => {
        const { getByText } = await renderApprovalButton({ isReady: true });

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render nothing when isReady is false', async () => {
        const { toJSON } = await renderApprovalButton({ isReady: false });

        expect(toJSON()).toBeNull();
    });

    it('should navigate to TradingExchangeOutputsReview on press', async () => {
        const { getByText } = await renderApprovalButton({ isReady: true });

        await userEvent.press(getByText('Continue'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: 'eth-account-1',
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
        });
    });

    it('should render nothing when no selected quote is provided', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = await renderApprovalButton({ isReady: true });

        expect(toJSON()).toBeNull();
    });
});
