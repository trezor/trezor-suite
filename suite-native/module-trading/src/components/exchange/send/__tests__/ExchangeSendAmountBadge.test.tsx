import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
import { type PreloadedState, renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { btcAsset, getWalletState } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeSendAmountBadge } from '../ExchangeSendAmountBadge';

describe('ExchangeSendAmountBadge', () => {
    let form: ExchangeFormType;

    const getPreloadedState = (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN): PreloadedState => ({
        wallet: getWalletState({ tradeType: 'exchange', bitcoinAmountUnit }),
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

        it('should display error message when field has error', async () => {
            act(() => {
                form.setError('sendCryptoAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('sendCryptoAmount', '1000');
            });

            const { getByText, queryByText } = await renderExchangeSendAmountBadge();

            expect(queryByText('$1.00')).toBeNull();
            expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
        });

        it('should display formatted fiat value when field has error, but quotes are loading', async () => {
            act(() => {
                form.setError('sendCryptoAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('sendCryptoAmount', '1000');
            });
            const preloadedState = getPreloadedState();
            preloadedState!.wallet!.trading!.exchange!.isLoading = true;

            const { getByText, queryByText } = await renderExchangeSendAmountBadge(preloadedState);

            expect(queryByText('VALIDATION_ERROR')).toBeNull();
            expect(getByText('$1.00')).toBeOnTheScreen();
        });

        it('should display correct value when using sats', async () => {
            act(() => {
                form.setValue('sendCryptoAmount', '1234567123456');
            });

            const { getByText } = await renderExchangeSendAmountBadge(
                getPreloadedState(PROTO.AmountUnit.SATOSHI),
            );

            expect(getByText('$12.35')).toBeOnTheScreen();
        });
    });
});
