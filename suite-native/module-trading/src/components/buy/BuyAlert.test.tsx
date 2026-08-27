import { deviceInitialState } from '@suite-common/device';
import { Form } from '@suite-native/forms';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { BuyAlert } from './BuyAlert';
import { useBuyForm } from '../../hooks/buy/useBuyForm';

describe('BuyAlert', () => {
    let form: BuyFormType;
    const preloadedState = {
        device: deviceInitialState,
        wallet: getWalletState({ tradeType: 'buy' }),
    };

    const renderFormHook = async () =>
        await renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

    const renderTradingAlert = async () =>
        await renderWithBasicProvider(<BuyAlert />, {
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
