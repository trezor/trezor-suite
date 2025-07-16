import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../../types/exchange';
import { ExchangeSendAmountBadge } from '../ExchangeSendAmountBadge';

describe('ExchangeSendAmountBadge', () => {
    let form: ExchangeFormType;

    const getPreloadedState = (): PreloadedState => ({
        wallet: getWalletState(),
    });

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeSendAmountBadge = (preloadedState: PreloadedState = getPreloadedState()) =>
        renderWithStoreProviderAsync(<ExchangeSendAmountBadge />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should display nothing when asset is not selected', async () => {
        const { toJSON } = await renderExchangeSendAmountBadge();

        expect(toJSON()).toBeNull();
    });

    describe('with asset', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
            });
        });

        it('should display nothing when amount is not set', async () => {
            const { toJSON } = await renderExchangeSendAmountBadge();

            expect(toJSON()).toBeNull();
        });

        it('should display formatted value when amount is 0', async () => {
            act(() => {
                form.setValue('sendCryptoAmount', '0');
            });

            const { getByText } = await renderExchangeSendAmountBadge();

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should display formatted value when amount is set', async () => {
            act(() => {
                form.setValue('sendCryptoAmount', '1234567');
            });

            const { getByText } = await renderExchangeSendAmountBadge();

            expect(getByText('$1,234.57')).toBeOnTheScreen();
        });
    });
});
