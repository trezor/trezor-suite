import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';
import { ETH_ACCOUNT_KEY, USDC_CONTRACT, mockWalletState } from '../__fixtures__/walletState';

const ONE_ETH = '1000000000000000000';
const ONE_USDC = '1000000';

describe('TransactionReviewOutputItemValues', () => {
    const renderValues = async ({
        accountKey = ETH_ACCOUNT_KEY,
        tokenContract,
        value = ONE_ETH,
    }: {
        accountKey?: AccountKey;
        tokenContract?: TokenAddress;
        value?: string;
    } = {}) =>
        await renderWithStoreProvider(
            <TransactionReviewOutputItemValues
                accountKey={accountKey}
                tokenContract={tokenContract}
                value={value}
                translationKey="transactionManagement.review.outputs.summary.totalAmount"
            />,
            { preloadedState: { wallet: mockWalletState() } },
        );

    it('should render the translated row label', async () => {
        const { getByText } = await renderValues();

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.totalAmount')),
        ).toBeOnTheScreen();
    });

    it('should render the native coin amount with its fiat value', async () => {
        const { getByText } = await renderValues();

        expect(getByText('1 ETH')).toBeOnTheScreen();
        expect(getByText('$1,000.00')).toBeOnTheScreen();
    });

    it('should render the token amount with its fiat value when tokenContract is set', async () => {
        const { getByText } = await renderValues({ tokenContract: USDC_CONTRACT, value: ONE_USDC });

        expect(getByText('1 usdc')).toBeOnTheScreen();
        expect(getByText('$0.99')).toBeOnTheScreen();
    });

    it('should render only the label when the account is unknown', async () => {
        const { getByText, queryByText } = await renderValues({
            accountKey: mockAccountKey({ descriptor: 'unknown' }),
        });

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.summary.totalAmount')),
        ).toBeOnTheScreen();
        expect(queryByText('1 ETH')).toBeNull();
    });
});
