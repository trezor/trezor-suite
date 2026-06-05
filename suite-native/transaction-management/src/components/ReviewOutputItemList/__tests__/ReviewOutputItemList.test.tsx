import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import {
    ETH_ACCOUNT_KEY,
    SOL_ACCOUNT_KEY,
    getWalletState,
} from '../../../__fixtures__/walletState';
import { type ReviewSummaryOutput, type StatefulReviewOutput } from '../../../types';
import { ReviewOutputItemList, type ReviewOutputItemListProps } from '../ReviewOutputItemList';

let mockSelectTransactionReviewOutputsFromDraftReturnValue: StatefulReviewOutput[] | null;
let mockSelectIsTransactionAlreadySignedValue: boolean;

jest.mock('../../../selectors', () => {
    const selectReviewSummaryOutputReturnValue = {
        state: 'active',
        totalSpent: '1200000000000000000', // 1.2 ETH in wei
        fee: '3000000000000000', // 0.003 ETH in wei
    } as ReviewSummaryOutput;

    return {
        selectIsTransactionAlreadySigned: () => mockSelectIsTransactionAlreadySignedValue,
        selectTransactionReviewActiveStepIndex: () => 0,
        selectReviewSummaryOutput: () => selectReviewSummaryOutputReturnValue,
        selectTransactionReviewOutputsFromDraft: () =>
            mockSelectTransactionReviewOutputsFromDraftReturnValue,
    };
});

describe('ReviewOutputItemList', () => {
    const renderReviewOutputItemList = (props: Partial<ReviewOutputItemListProps> = {}) =>
        renderWithStoreProvider(
            <ReviewOutputItemList prefix="send" accountKey={ETH_ACCOUNT_KEY} {...props} />,
            { preloadedState: { wallet: getWalletState() } },
        );

    beforeEach(() => {
        mockSelectTransactionReviewOutputsFromDraftReturnValue = [
            {
                type: 'address',
                value: 'abcdefghijklmnopqrstuvwx',
                state: 'success',
            },
            {
                type: 'timebounds',
                value: 'should not matter',
                state: 'active',
            },
        ] as StatefulReviewOutput[];

        mockSelectIsTransactionAlreadySignedValue = false;
    });

    it('should render Error when account is not found', () => {
        const { getByText } = renderReviewOutputItemList({
            accountKey: mockAccountKey({ symbol: 'btc', descriptor: 'btcAccount3' }),
        });

        expect(getByText('Error: Account not found.')).toBeOnTheScreen();
    });

    it('should render outputs list', () => {
        const { getByText } = renderReviewOutputItemList({});

        expect(getByText('Recipient address')).toBeOnTheScreen();
        expect(getByText('abcd efgh ijkl mnop qrst uvwx')).toBeOnTheScreen();
        expect(getByText('TimeBounds')).toBeOnTheScreen();
        expect(getByText('No restriction')).toBeOnTheScreen();
        expect(getByText('Amount')).toBeOnTheScreen();
        expect(getByText('Maximum fee')).toBeOnTheScreen();
    });

    it('should render empty list when reviewOutputs are undefined', () => {
        mockSelectTransactionReviewOutputsFromDraftReturnValue = null;
        const { queryByText } = renderReviewOutputItemList({});

        expect(queryByText('Recipient address')).toBeNull();
        expect(queryByText('TimeBounds')).toBeNull();
        expect(queryByText('Amount')).toBeNull();
        expect(queryByText('Maximum fee')).toBeNull();
    });

    describe('SlidingFooterOverlay', () => {
        it('should render when transaction is not signed', () => {
            const { getByTestId } = renderReviewOutputItemList({});

            expect(getByTestId('sliding-footer-overlay')).toBeOnTheScreen();
        });

        it('should render when transaction is already signed', () => {
            mockSelectIsTransactionAlreadySignedValue = true;
            const { queryByTestId } = renderReviewOutputItemList({});

            expect(queryByTestId('sliding-footer-overlay')).toBeNull();
        });

        it('should not render for Solana accounts', () => {
            const { queryByTestId } = renderReviewOutputItemList({
                accountKey: SOL_ACCOUNT_KEY,
            });

            expect(queryByTestId('sliding-footer-overlay')).toBeNull();
        });
    });
});
