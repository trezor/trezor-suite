import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import {
    SEND_ACCOUNT_BALANCE_TEST_ID,
    SellSendAccountCryptoBalance,
} from './SellSendAccountCryptoBalance';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import {
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('SellSendAccountCryptoBalance', () => {
    let sellForm: SellFormType;

    const renderSellForm = async () => {
        const { result } = await renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
        });

        return result.current;
    };

    const renderComponent = async () =>
        await renderWithTradingProvider(<SellSendAccountCryptoBalance />, {
            tradeType: 'sell',
            wrapper: ({ children }) => <Form form={sellForm}>{children}</Form>,
        });

    beforeEach(async () => {
        sellForm = await renderSellForm();
    });

    it('should use asset form field as default symbol', async () => {
        await act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', async () => {
        await act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        await act(() => {
            sellForm.setValue('sendAccount', getBtcAccount());
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
