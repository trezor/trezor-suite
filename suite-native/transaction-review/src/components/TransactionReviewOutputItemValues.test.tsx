import { type TokenAddress, toTokenSymbol } from '@suite-common/tokens';
import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';
import { ETH_ACCOUNT_KEY, USDC_CONTRACT, mockWalletState } from '../__fixtures__/walletState';

const ONE_ETH = '1000000000000000000';
const ONE_USDC = '1000000';

describe('TransactionReviewOutputItemValues', () => {
    const renderValues = ({
        accountKey = ETH_ACCOUNT_KEY,
        tokenContract,
        value = ONE_ETH,
    }: {
        accountKey?: AccountKey;
        tokenContract?: TokenAddress;
        value?: string;
    } = {}) =>
        renderWithStoreProvider(
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

    it.each([true, false])(
        'keeps a URL-like symbol readable only when recognized (%s)',
        async isRecognized => {
            const wallet = mockWalletState();
            const account = wallet.accounts.find(({ key }) => key === ETH_ACCOUNT_KEY)!;
            const token = account.tokens?.[0];
            if (!token) throw new Error('Expected the ETH account fixture to contain a token');
            token.symbol = toTokenSymbol('token.example');

            const { getByText, queryByLabelText } = await renderWithStoreProvider(
                <TransactionReviewOutputItemValues
                    accountKey={ETH_ACCOUNT_KEY}
                    tokenContract={USDC_CONTRACT}
                    value={ONE_USDC}
                    translationKey="transactionManagement.review.outputs.summary.totalAmount"
                />,
                {
                    preloadedState: {
                        wallet,
                        tokenDefinitions: {
                            eth: {
                                coin: {
                                    data: isRecognized ? [USDC_CONTRACT] : [],
                                    // Hiding a recognized token must not change its recognition status.
                                    hide: [USDC_CONTRACT],
                                    show: [],
                                },
                            },
                        },
                    },
                },
            );

            if (isRecognized) {
                expect(getByText('1 token.example')).toBeVisible();
                expect(queryByLabelText('…')).toBeNull();
            } else {
                expect(queryByLabelText('…')).toBeOnTheScreen();
            }
        },
    );

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
