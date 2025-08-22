import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../../types/sell';
import { SellSendAmountBadge } from '../SellSendAmountBadge';

describe('SellSendAmountBadge', () => {
    let form: SellFormType;

    const getPreloadedState = (): PreloadedState => ({
        wallet: getWalletState(),
    });

    const renderForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellSendAmountBadge = (preloadedState: PreloadedState = getPreloadedState()) =>
        renderWithStoreProviderAsync(<SellSendAmountBadge />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should display nothing when asset is not selected', async () => {
        const { toJSON } = await renderSellSendAmountBadge();

        expect(toJSON()).toBeNull();
    });

    describe('with asset', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
            });
        });

        it('should display nothing when amount is not set', async () => {
            const { toJSON } = await renderSellSendAmountBadge();

            expect(toJSON()).toBeNull();
        });

        it('should display formatted value when amount is 0', async () => {
            act(() => {
                form.setValue('cryptoStringAmount', '0');
            });

            const { getByText } = await renderSellSendAmountBadge();

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should display formatted value when amount is set', async () => {
            act(() => {
                form.setValue('cryptoStringAmount', '1234567');
            });

            const { getByText } = await renderSellSendAmountBadge();

            expect(getByText('$1,234.57')).toBeOnTheScreen();
        });

        it('should display error message when field has error', async () => {
            act(() => {
                form.setError('cryptoStringAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('cryptoStringAmount', '1000');
            });

            const { getByText, queryByText } = await renderSellSendAmountBadge();

            expect(queryByText('$1.00')).toBeNull();
            expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
        });

        it('should display formatted fiat value when field has error, but quotes are loading', async () => {
            act(() => {
                form.setError('cryptoStringAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('cryptoStringAmount', '1000');
            });
            const preloadedState = getPreloadedState();
            preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;

            const { getByText, queryByText } = await renderSellSendAmountBadge(preloadedState);

            expect(queryByText('VALIDATION_ERROR')).toBeNull();
            expect(getByText('$1.00')).toBeOnTheScreen();
        });
    });
});
