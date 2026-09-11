import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { btcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { SellSendFiatAmountBadge } from './SellSendFiatAmountBadge';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('SellSendFiatAmountBadge', () => {
    let tradingForm: SellFormType;

    const renderUseTradingSellForm = async () => {
        const { result } = await renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
        });

        return result.current;
    };

    const getOverrides = (
        bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    ): PreloadedStatePartial<TradingTestPreloadedState> => ({
        wallet: { settings: { bitcoinAmountUnit } },
    });

    const renderSellSendFiatAmountBadge = async (
        form: SellFormType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getOverrides(),
    ) =>
        await renderWithTradingProvider(
            <Form form={form}>
                <SellSendFiatAmountBadge />
            </Form>,
            { tradeType: 'sell', overrides },
        );

    beforeEach(async () => {
        tradingForm = await renderUseTradingSellForm();
    });

    it('should display nothing when asset is not selected', async () => {
        const { toJSON } = await renderSellSendFiatAmountBadge(tradingForm);

        expect(toJSON()).toBeNull();
    });

    describe('with asset', () => {
        beforeEach(async () => {
            await act(() => {
                tradingForm.setValue('sendAsset', btcAsset);
            });
        });

        it('should display nothing when amount is not set', async () => {
            const { toJSON } = await renderSellSendFiatAmountBadge(tradingForm);

            expect(toJSON()).toBeNull();
        });

        it('should display formatted value when amount is 0', async () => {
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0');
            });

            const { getByText } = await renderSellSendFiatAmountBadge(tradingForm);

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should display formatted value when amount is set', async () => {
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '1234567');
            });

            const { getByText } = await renderSellSendFiatAmountBadge(tradingForm);

            expect(getByText('$1,234.57')).toBeOnTheScreen();
        });

        it('should display formatted fiat value even when field has error', async () => {
            await act(() => {
                tradingForm.setError('cryptoStringAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                tradingForm.setValue('cryptoStringAmount', '1000');
            });

            const { getByText, queryByText } = await renderSellSendFiatAmountBadge(tradingForm);

            expect(queryByText('VALIDATION_ERROR')).toBeNull();
            expect(getByText('$1.00')).toBeOnTheScreen();
        });

        it('should display correct value when using sats', async () => {
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '1234567123456');
            });

            const { getByText } = await renderSellSendFiatAmountBadge(
                tradingForm,
                getOverrides(PROTO.AmountUnit.SATOSHI),
            );

            expect(getByText('$12.35')).toBeOnTheScreen();
        });
    });
});
