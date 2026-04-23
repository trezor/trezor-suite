import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import {
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import {
    SEND_ACCOUNT_BALANCE_TEST_ID,
    SellSendAccountCryptoBalance,
} from '../SellSendAccountCryptoBalance';

describe('SellSendAccountCryptoBalance', () => {
    let sellForm: SellFormType;

    const renderSellForm = () => {
        const { result } = renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
            providers: ['intl', 'formatter', 'navigation'],
        });

        return result.current;
    };

    const renderComponent = () =>
        renderWithTradingProvider(<SellSendAccountCryptoBalance />, {
            tradeType: 'sell',
            wrapper: ({ children }) => <Form form={sellForm}>{children}</Form>,
            providers: ['intl', 'formatter', 'navigation'],
        });

    beforeEach(() => {
        sellForm = renderSellForm();
    });

    it('should use asset form field as default symbol', () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        act(() => {
            sellForm.setValue('sendAccount', getBtcAccount());
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
