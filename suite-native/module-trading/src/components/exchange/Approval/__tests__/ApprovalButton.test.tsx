import { tradingExchangeActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type TestStore,
    initStore,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils';
import { getWalletState, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ApprovalButton, type ApprovalButtonProps } from '../ApprovalButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ApprovalButton', () => {
    let store: TestStore;

    const renderApprovalButton = (props: Partial<ApprovalButtonProps>) =>
        renderWithStoreProvider(<ApprovalButton flowType="approve" isReady {...props} />, {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = mercuryoFixedWorstQuote;
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey =
            'eth-account-1' as AccountKey;
        store = initStore(preloadedState).store;
    });

    it('should render continue button when isReady is true', () => {
        const { getByText } = renderApprovalButton({ isReady: true });

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render nothing when isReady is false', () => {
        const { toJSON } = renderApprovalButton({ isReady: false });

        expect(toJSON()).toBeNull();
    });

    it('should navigate to TradingExchangeOutputsReview on press', async () => {
        const { getByText } = renderApprovalButton({ isReady: true });

        await userEvent.press(getByText('Continue'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: 'eth-account-1',
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
            flowType: 'approve',
        });
    });

    it('should navigate to TradingExchangeOutputsReview on press for flowType revoke', async () => {
        const { getByText } = renderApprovalButton({ isReady: true, flowType: 'revoke' });

        await userEvent.press(getByText('Continue'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: 'eth-account-1',
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
            flowType: 'revoke',
        });
    });

    it('should render nothing when no selected quote is provided', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = renderApprovalButton({ isReady: true });

        expect(toJSON()).toBeNull();
    });
});
