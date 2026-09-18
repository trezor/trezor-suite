import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import {
    ReviewOutputSummaryItem,
    type ReviewOutputSummaryItemProps,
} from './ReviewOutputSummaryItem';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const mockSelectIsClearSignedTradingSwap = jest.fn();
jest.mock('../../selectors', () => ({
    ...jest.requireActual('../../selectors'),
    selectIsClearSignedTradingSwap: (...args: unknown[]) =>
        mockSelectIsClearSignedTradingSwap(...args),
}));

jest.mock('./ReviewOutputItemValues', () => ({
    ReviewOutputItemValues: ({
        translationKey,
        value,
        tokenContract,
    }: {
        translationKey: string;
        value: string;
        tokenContract?: TokenAddress;
    }) => (
        <>
            <MockText>
                ReviewOutputItemValues: [{translationKey}]-[{value}]
            </MockText>
            {!!tokenContract && <MockText>token: {tokenContract}</MockText>}
        </>
    ),
}));

describe('ReviewOutputSummaryItem', () => {
    const renderReviewOutputSummaryItem = async (
        props: Partial<ReviewOutputSummaryItemProps>,
        preloadedState: Record<string, unknown> = { wallet: getWalletState() },
    ) =>
        await renderWithStoreProvider(
            <ReviewOutputSummaryItem
                accountKey={ETH_ACCOUNT_KEY}
                symbol={btcSymbol}
                onLayout={jest.fn()}
                prefix="trading-buy"
                {...props}
            />,
            { preloadedState },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectIsClearSignedTradingSwap.mockReturnValue(false);
    });

    it('should render nothing when summaryOutput is not specified', async () => {
        const { toJSON } = await renderReviewOutputSummaryItem({});

        expect(toJSON()).toBeNull();
    });

    it('should render "total amount" and "fee" for BTC', async () => {
        const { getByText } = await renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
        });

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.totalAmount]-[1000]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.fee]-[10]',
            ),
        ).toBeTruthy();
    });

    it('should render "amount" and "max fee" for ETH', async () => {
        const { getByText } = await renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: ethSymbol,
        });

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.amount]-[990]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });

    it.each<'approve' | 'revoke' | 'revoke-and-approve'>([
        'approve',
        'revoke',
        'revoke-and-approve',
    ])('should not render "amount" for flowType "%s"', async flowType => {
        const { getByText, queryByText } = await renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: ethSymbol,
            flowType,
        });

        expect(
            queryByText(
                /ReviewOutputItemValues: \[transactionManagement\.review\.outputs\.summary\.amount\]/,
            ),
        ).toBeNull();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });

    it('should render "amount" and "max fee" for USDC', async () => {
        const { getByText } = await renderReviewOutputSummaryItem(
            {
                summaryOutput: {
                    totalSpent: '1000',
                    fee: '10',
                    state: 'active',
                },
                symbol: ethSymbol,
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
            },
            {
                wallet: {
                    send: {
                        precomposedTx: {
                            totalSpent: '1000',
                            fee: '10',
                            token: {
                                contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                                decimals: 6,
                                symbol: 'usdc',
                            },
                        },
                    },
                },
            },
        );

        expect(getByText('token: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeOnTheScreen();

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.label')),
        ).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.amount]-[1000]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });

    it('shows zero native ETH for a blind swap with a token selected on the screen', async () => {
        const { getByText, queryByText } = await renderReviewOutputSummaryItem(
            {
                summaryOutput: {
                    totalSpent: '594793503648162',
                    fee: '594793503648162',
                    state: 'active',
                },
                symbol: ethSymbol,
                flowType: 'swap',
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
            },
            {
                wallet: {
                    send: {
                        precomposedTx: {
                            totalSpent: '594793503648162',
                            fee: '594793503648162',
                            token: undefined,
                        },
                    },
                },
            },
        );

        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.amount]-[0]',
            ),
        ).toBeOnTheScreen();
        expect(queryByText(/^token:/)).toBeNull();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[594793503648162]',
            ),
        ).toBeOnTheScreen();
    });

    it('should not render "amount" if transaction is clear-signed', async () => {
        mockSelectIsClearSignedTradingSwap.mockReturnValue(true);

        const { queryByText, getByText } = await renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: ethSymbol,
        });

        expect(
            queryByText(
                /ReviewOutputItemValues: \[transactionManagement\.review\.outputs\.summary\.amount]/,
            ),
        ).toBeNull();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });
});
