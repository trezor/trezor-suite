import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
    ReceiveAccountCryptoBalance,
} from '../ReceiveAccountCryptoBalance';

describe('ReceiveAccountBalance', () => {
    it('should display empty box when symbol is not specified', () => {
        const { getByTestId } = renderWithBasicProvider(
            <ReceiveAccountCryptoBalance symbol={undefined} balance="10000" />,
        );

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('');
    });

    it('should display empty box when balance is not specified', () => {
        const { getByTestId } = renderWithBasicProvider(
            <ReceiveAccountCryptoBalance symbol="btc" balance={undefined} />,
        );

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('');
    });

    it('should display balance when symbol and balance is specified', () => {
        const { getByTestId } = renderWithBasicProvider(
            <ReceiveAccountCryptoBalance symbol="btc" balance="1000000" />,
        );

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('0.01 BTC');
    });
});
