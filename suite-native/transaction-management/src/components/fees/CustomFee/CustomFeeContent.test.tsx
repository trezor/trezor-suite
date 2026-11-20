import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { CustomFeeContent } from './CustomFeeContent';
import { getWalletState } from '../../../__fixtures__/walletState';

jest.mock('./CustomFeeInputs', () => ({ CustomFeeInputs: () => null }));

describe('CustomFeeContent total', () => {
    it('shows unavailable instead of a zero price after an unsuccessful estimate', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <CustomFeeContent
                symbol={asNetworkSymbol('eth')}
                feeValue={null}
                isFeeLoading={false}
                errorMessage="Insufficient balance for this fee."
            />,
            { preloadedState: { wallet: getWalletState() } },
        );

        expect(getByText('Unavailable')).toBeOnTheScreen();
        expect(queryByText(/ETH|\$/)).toBeNull();
        expect(getByText('Insufficient balance for this fee.')).toBeOnTheScreen();
    });

    it('keeps a pending replacement estimate in the loading state', async () => {
        const { getAllByTestId, queryByText } = await renderWithStoreProvider(
            <CustomFeeContent
                symbol={asNetworkSymbol('eth')}
                feeValue={null}
                isFeeLoading
                errorMessage={null}
            />,
            { preloadedState: { wallet: getWalletState() } },
        );

        expect(getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
        expect(queryByText('Unavailable')).toBeNull();
    });
});
