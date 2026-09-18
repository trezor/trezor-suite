import { View } from 'react-native';

import {
    type TransactionReviewStatefulOutput,
    type TransactionReviewSummaryOutput,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';

import { TransactionReviewOutputsList } from './TransactionReviewOutputsList';
import {
    type TransactionReviewTestProviderProps,
    renderWithTransactionReview,
} from '../__fixtures__/renderWithTransactionReview';
import { ETH_ACCOUNT_KEY, SOL_ACCOUNT_KEY, TRX_ACCOUNT_KEY } from '../__fixtures__/walletState';

jest.mock('./TransactionReviewOutputItemValues', () => ({
    TransactionReviewOutputItemValues: ({
        translationKey,
        value,
    }: {
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            Values: [{translationKey}]-[{value}]
        </MockText>
    ),
}));

const SLIDING_OVERLAY_TEST_ID = 'sliding-footer-overlay';

const reviewOutputs: TransactionReviewStatefulOutput[] = [
    { type: 'address', value: 'abcdefghijklmnopqrstuvwx', state: 'success' },
    { type: 'timebounds', value: '', state: 'active' },
];

const summaryOutput: TransactionReviewSummaryOutput = {
    totalSpent: '1000',
    fee: '10',
    state: undefined,
};

describe('TransactionReviewOutputsList', () => {
    const renderList = async (providerProps: TransactionReviewTestProviderProps = {}) =>
        await renderWithTransactionReview(<TransactionReviewOutputsList />, {
            providerProps: { reviewOutputs, summaryOutput, ...providerProps },
        });

    it('should render nothing when review outputs are not available yet', async () => {
        const { toJSON } = await renderList({ reviewOutputs: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when the account is unknown', async () => {
        const { toJSON } = await renderList({
            accountKey: mockAccountKey({ descriptor: 'unknown' }),
        });

        expect(toJSON()).toBeNull();
    });

    it('should render every output and the default summary card', async () => {
        const { getByText } = await renderList();

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.addressLabel')),
        ).toBeOnTheScreen();
        expect(getByText('abcd efgh ijkl mnop qrst uvwx')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('transactionManagement.review.outputs.timeboundsLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('transactionManagement.review.outputs.timeboundsNotSet')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.maxFee]-[10]'),
        ).toBeOnTheScreen();
    });

    it('should render the custom summary item instead of the default one', async () => {
        const renderSummaryItem = jest.fn(() => <MockText>Custom summary</MockText>);

        const { getByText, queryByText } = await renderList({ renderSummaryItem });

        expect(renderSummaryItem).toHaveBeenCalledWith({ onLayout: expect.any(Function) });
        expect(getByText('Custom summary')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeNull();
    });

    it('should not render the default summary card for a Tron account', async () => {
        const { queryByText, getByText } = await renderList({ accountKey: TRX_ACCOUNT_KEY });

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.addressLabel')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeNull();
    });

    it('should render a summary card with the content of the title override', async () => {
        const { getByText } = await renderList({
            outputTitleOverride: () => <View testID="override" />,
        });

        // The summary card keeps the default title; overrides only affect outputs.
        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeOnTheScreen();
    });

    describe('sliding footer overlay', () => {
        it('should render while the transaction is not signed', async () => {
            const { getByTestId } = await renderList();

            expect(getByTestId(SLIDING_OVERLAY_TEST_ID)).toBeOnTheScreen();
        });

        it('should not render once the transaction is signed', async () => {
            const { queryByTestId } = await renderList({ isTransactionAlreadySigned: true });

            expect(queryByTestId(SLIDING_OVERLAY_TEST_ID)).toBeNull();
        });

        it('should not render for a Solana account by default', async () => {
            const { queryByTestId } = await renderList({ accountKey: SOL_ACCOUNT_KEY });

            expect(queryByTestId(SLIDING_OVERLAY_TEST_ID)).toBeNull();
        });

        it('should respect an explicit enable for a Solana account', async () => {
            const { getByTestId } = await renderList({
                accountKey: SOL_ACCOUNT_KEY,
                isSlidingOverlayEnabled: true,
            });

            expect(getByTestId(SLIDING_OVERLAY_TEST_ID)).toBeOnTheScreen();
        });

        it('should respect an explicit disable for other accounts', async () => {
            const { queryByTestId } = await renderList({
                accountKey: ETH_ACCOUNT_KEY,
                isSlidingOverlayEnabled: false,
            });

            expect(queryByTestId(SLIDING_OVERLAY_TEST_ID)).toBeNull();
        });
    });
});
