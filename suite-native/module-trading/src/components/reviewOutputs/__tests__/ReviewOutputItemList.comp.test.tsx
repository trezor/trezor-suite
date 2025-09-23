import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import { ReviewOutputItemList, ReviewOutputItemListProps } from '../ReviewOutputItemList';

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectTransactionReviewActiveStepIndex: jest.fn().mockReturnValue(1),
    selectReviewSummaryOutput: jest.fn().mockReturnValue({
        state: 'active',
        totalSpent: '1000010000',
        fee: '10000',
    }),
    selectTransactionReviewOutputsFromDraft: jest.fn().mockReturnValue([
        { type: 'address', value: '0x12345', state: 'success' },
        { type: 'amount', value: '1000000000', state: 'active' },
    ]),
    selectIsTransactionAlreadySigned: jest.fn().mockReturnValue(false),
}));

describe('ReviewOutputItemList', () => {
    const renderReviewOutputItemList = (
        props: Partial<ReviewOutputItemListProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ReviewOutputItemList accountKey="btc-account-1" tradingType="exchange" {...props} />,
            { preloadedState },
        );

    it('should render transaction-management/ReviewOutputItemList with values loaded from state', async () => {
        const { getByText } = await renderReviewOutputItemList(
            {},
            { wallet: getWalletState({ tradeType: 'exchange' }) },
        );

        expect(getByText('Recipient address')).toBeOnTheScreen();
        expect(getByText('0x12 345')).toBeOnTheScreen();
        expect(getByText('10 BTC')).toBeOnTheScreen();
        expect(getByText('10.0001 BTC')).toBeOnTheScreen(); // total with fee
    });
});
