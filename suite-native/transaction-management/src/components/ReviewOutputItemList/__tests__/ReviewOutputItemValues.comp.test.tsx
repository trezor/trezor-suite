import type { TokenAddress } from '@suite-common/wallet-types';
import type { PreloadedState } from '@suite-native/test-utils';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import type { ReviewOutputItemValuesProps } from '../ReviewOutputItemValues';
import { ReviewOutputItemValues } from '../ReviewOutputItemValues';

const oneUsdc = '1000000'; // 1 USDC in smallest unit

describe('ReviewOutputItemValues', () => {
    const renderReviewOutputItemValues = (
        props: Partial<ReviewOutputItemValuesProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ReviewOutputItemValues
                accountKey="eth-account-1"
                value={oneUsdc}
                translationKey="transactionManagement.review.outputs.summary.totalAmount"
                {...props}
            />,
            {
                preloadedState,
            },
        );

    it('should render translated title', async () => {
        const { getByText } = await renderReviewOutputItemValues({}, { wallet: getWalletState() });

        expect(getByText('Total amount')).toBeOnTheScreen();
    });

    it('should render token balance', async () => {
        const { getByText } = await renderReviewOutputItemValues(
            {
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
            },
            { wallet: getWalletState() },
        );

        expect(getByText('1 usdc')).toBeOnTheScreen();
        expect(getByText('$0.99')).toBeOnTheScreen();
    });
});
