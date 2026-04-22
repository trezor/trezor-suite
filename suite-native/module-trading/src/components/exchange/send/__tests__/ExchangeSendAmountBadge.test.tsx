import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { btcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeSendAmountBadge } from '../ExchangeSendAmountBadge';

describe('ExchangeSendAmountBadge', () => {
    let form: ExchangeFormType;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
        },
    };

    const renderExchangeSendAmountBadge = (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(<ExchangeSendAmountBadge />, {
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        form = result.current;
    });

    it('should display nothing when asset is not selected', () => {
        const { toJSON } = renderExchangeSendAmountBadge();

        expect(toJSON()).toBeNull();
    });

    describe('with asset', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
            });
        });

        it('should display nothing when amount is not set', () => {
            const { toJSON } = renderExchangeSendAmountBadge();

            expect(toJSON()).toBeNull();
        });

        it('should display formatted value when amount is 0', () => {
            act(() => {
                form.setValue('sendCryptoAmount', '0');
            });

            const { getByText } = renderExchangeSendAmountBadge();

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should display formatted value when amount is set', () => {
            act(() => {
                form.setValue('sendCryptoAmount', '1234567');
            });

            const { getByText } = renderExchangeSendAmountBadge();

            expect(getByText('$1,234.57')).toBeOnTheScreen();
        });

        it('should display error message when field has error', () => {
            act(() => {
                form.setError('sendCryptoAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('sendCryptoAmount', '1000');
            });

            const { getByText, queryByText } = renderExchangeSendAmountBadge();

            expect(queryByText('$1.00')).toBeNull();
            expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
        });

        it('should display formatted fiat value when field has error, but quotes are loading', () => {
            act(() => {
                form.setError('sendCryptoAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
                form.setValue('sendCryptoAmount', '1000');
            });

            const { getByText, queryByText } = renderExchangeSendAmountBadge({
                wallet: { trading: { exchange: { isLoading: true } } },
            });

            expect(queryByText('VALIDATION_ERROR')).toBeNull();
            expect(getByText('$1.00')).toBeOnTheScreen();
        });

        it('should display correct value when using sats', () => {
            act(() => {
                form.setValue('sendCryptoAmount', '1234567123456');
            });

            const { getByText } = renderExchangeSendAmountBadge({
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
            });

            expect(getByText('$12.35')).toBeOnTheScreen();
        });
    });
});
