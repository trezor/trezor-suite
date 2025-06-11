import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import {
    ReceiveAccountCryptoBalance,
    ReceiveAccountCryptoBalanceProps,
} from '../ReceiveAccountCryptoBalance';

describe('ReceiveAccountCryptoBalance', () => {
    const renderComponent = (props: ReceiveAccountCryptoBalanceProps) =>
        renderWithStoreProviderAsync(<ReceiveAccountCryptoBalance testID="TEST_ID" {...props} />);

    it('should display empty box when nor symbol nor defaultSymbol is specified', async () => {
        const { queryByTestId } = await renderComponent({
            account: {
                symbol: undefined,
                balance: '10000',
            } as any,
            defaultSymbol: undefined,
        });

        expect(queryByTestId('TEST_ID')).toBeNull();
    });

    it('should display empty balance when balance is not specified', async () => {
        const { getByTestId } = await renderComponent({
            account: {
                symbol: 'btc',
                balance: undefined,
            } as any,
            defaultSymbol: undefined,
        });

        expect(getByTestId('TEST_ID')).toHaveTextContent('Balance:- BTC');
    });

    it('should display balance when symbol and balance is specified', async () => {
        const { getByTestId } = await renderComponent({
            account: {
                symbol: 'btc',
                balance: '1000000',
            } as any,
            defaultSymbol: undefined,
        });

        expect(getByTestId('TEST_ID')).toHaveTextContent('Balance:0.01 BTC');
    });

    it('should display empty balance when defaultSymbol is specified', async () => {
        const { getByTestId } = await renderComponent({
            account: undefined,
            defaultSymbol: 'btc',
        });

        expect(getByTestId('TEST_ID')).toHaveTextContent('Balance:- BTC');
    });

    describe('without testID specified', () => {
        it('should render correctly with unknown balance', async () => {
            const { getByText } = await renderComponent({
                account: undefined,
                defaultSymbol: 'btc',
                testID: undefined,
            });

            expect(getByText('Balance:')).toBeOnTheScreen();
            expect(getByText('- BTC')).toBeOnTheScreen();
        });

        it('should render correctly with known balance', async () => {
            const { getByText } = await renderComponent({
                account: {
                    symbol: 'btc',
                    balance: '1000000',
                } as any,
                defaultSymbol: undefined,
                testID: undefined,
            });

            expect(getByText('Balance:')).toBeOnTheScreen();
            expect(getByText('0.01 BTC')).toBeOnTheScreen();
        });
    });
});
