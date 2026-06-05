import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ETH_ACCOUNT_KEY, getWalletState } from '../../../__fixtures__/walletState';
import {
    ReviewOutputItemValues,
    type ReviewOutputItemValuesProps,
} from '../ReviewOutputItemValues';

const oneUsdc = '1000000'; // 1 USDC in smallest unit

describe('ReviewOutputItemValues', () => {
    const renderReviewOutputItemValues = (
        props: Partial<ReviewOutputItemValuesProps> = {},
        preloadedState = {},
    ) =>
        renderWithStoreProvider(
            <ReviewOutputItemValues
                accountKey={ETH_ACCOUNT_KEY}
                value={oneUsdc}
                translationKey="transactionManagement.review.outputs.summary.totalAmount"
                {...props}
            />,
            {
                preloadedState,
            },
        );

    it('should render translated title', () => {
        const { getByText } = renderReviewOutputItemValues({}, { wallet: getWalletState() });

        expect(getByText('Total amount')).toBeOnTheScreen();
    });

    it('should render token balance', () => {
        const { getByText } = renderReviewOutputItemValues(
            {
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
            },
            { wallet: getWalletState() },
        );

        expect(getByText('1 usdc')).toBeOnTheScreen();
        expect(getByText('$0.99')).toBeOnTheScreen();
    });
});
