import { Form } from '@suite-native/forms';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { SellAlert } from './SellAlert';
import { useSellForm } from '../../hooks/sell/useSellForm';

describe('SellAlert', () => {
    let form: SellFormType;
    const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

    const renderFormHook = async () =>
        await renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
        });

    const renderTradingAlert = async () =>
        await renderWithBasicProvider(<SellAlert />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderFormHook();
        form = result.current;
    });

    it('should render alert based on form generalAlert value', async () => {
        await act(() => {
            form.setValue('generalAlert', 'TEST');
        });

        const { getByText } = await renderTradingAlert();

        expect(getByText('TEST')).toBeTruthy();
    });

    it.each([undefined, ''])(
        'should render nothing when generalAlert is %s',
        async generalAlertValue => {
            await act(() => {
                form.setValue('generalAlert', generalAlertValue);
            });

            const { toJSON } = await renderTradingAlert();

            expect(toJSON()).toBeNull();
        },
    );
});
