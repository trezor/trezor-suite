import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import { ReviewSummaryOutput, StatefulReviewOutput } from '../../../types';
import { ReviewOutputItemList, ReviewOutputItemListProps } from '../ReviewOutputItemList';

describe('ReviewOutputItemList', () => {
    const renderReviewOutputItemList = (
        props: Partial<ReviewOutputItemListProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ReviewOutputItemList
                accountKey="eth-account-1"
                activeStep={0}
                isTransactionAlreadySigned={false}
                {...props}
            />,
            { preloadedState },
        );

    it('should render Error when account is not found', async () => {
        const { getByText } = await renderReviewOutputItemList({}, {});

        expect(getByText('Error: Account not found.')).toBeOnTheScreen();
    });

    it('should render outputs list', async () => {
        const reviewOutputs = [
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
        const summaryOutput = {
            state: 'active',
            totalSpent: '1200000000000000000', // 1.2 ETH in wei
            fee: '3000000000000000', // 0.003 ETH in wei
        } as ReviewSummaryOutput;
        const { getByText } = await renderReviewOutputItemList(
            { reviewOutputs, summaryOutput, isTransactionAlreadySigned: true },
            { wallet: getWalletState() },
        );

        expect(getByText('Recipient address')).toBeOnTheScreen();
        expect(getByText('abcd efgh ijkl mnop qrst uvwx')).toBeOnTheScreen();
        expect(getByText('TimeBounds')).toBeOnTheScreen();
        expect(getByText('No restriction')).toBeOnTheScreen();
        expect(getByText('Amount')).toBeOnTheScreen();
        expect(getByText('Maximum fee')).toBeOnTheScreen();
    });

    it('should render empty list when reviewOutputs are undefined', async () => {
        const reviewOutputs = undefined;
        const summaryOutput = {
            state: 'active',
            totalSpent: '1200000000000000000', // 1.2 ETH in wei
            fee: '3000000000000000', // 0.003 ETH in wei
        } as ReviewSummaryOutput;
        const { queryByText } = await renderReviewOutputItemList(
            { reviewOutputs, summaryOutput, isTransactionAlreadySigned: false },
            { wallet: getWalletState() },
        );

        expect(queryByText('Recipient address')).toBeNull();
        expect(queryByText('TimeBounds')).toBeNull();
        expect(queryByText('Amount')).toBeNull();
        expect(queryByText('Maximum fee')).toBeNull();
    });
});
