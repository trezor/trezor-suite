import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import {
    BuyReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from '../BuyReceiveAccountCryptoBalance';

describe('BuyReceiveAccountCryptoBalance', () => {
    let buyForm: TradingBuyForm;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());

        return result.current;
    };

    const renderComponent = async () =>
        await renderWithStoreProviderAsync(
            <Form form={buyForm}>
                <BuyReceiveAccountCryptoBalance />
            </Form>,
        );

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should display empty box when nor symbol nor asset is specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: undefined,
                    balance: '10000',
                } as any,
            });
        });
        const { queryByTestId } = await renderComponent();

        expect(queryByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
    });

    it('should display empty balance when balance is not specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: undefined,
                } as any,
            });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should display balance when symbol and balance is specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: '1000000',
                } as any,
            });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });

    it('should display empty balance when symbol is not specified, but asset is', async () => {
        act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });
});
