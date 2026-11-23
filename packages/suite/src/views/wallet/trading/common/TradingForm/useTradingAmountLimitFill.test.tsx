import { type PropsWithChildren } from 'react';
import { type DefaultValues, useForm } from 'react-hook-form';

import { act, renderHook } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    TRADING_FORM_AMOUNT_INPUT_SOURCE,
    TRADING_FORM_AMOUNT_IN_CRYPTO,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingType,
} from '@suite-common/trading';
import { ServicesProvider, mock } from '@trezor/dependency-injection';

import {
    type TradingAllFormProps,
    type TradingUseFormActionsReturnProps,
} from '#src/types/trading/tradingForm';
import { type AmountLimitProps } from '#src/utils/suite/validation';

import {
    TRADING_CRYPTO_LIMITS_RULE,
    TRADING_FIAT_MAX_RULE,
} from './TradingFormInput/TradingFormInputFiatCrypto/tradingFormInputFiatCryptoRules';
import { useTradingAmountLimitFill } from './useTradingAmountLimitFill';

const mockUseTradingFormContext = jest.fn();

jest.mock('#src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

type HookParams = Parameters<typeof useTradingAmountLimitFill>[0];

type RenderAmountLimitFillParams = {
    type: TradingType;
    amountLimits: AmountLimitProps;
    defaultValues: DefaultValues<TradingAllFormProps>;
    hookParams: HookParams;
};

const renderAmountLimitFill = ({
    type,
    amountLimits,
    defaultValues,
    hookParams,
}: RenderAmountLimitFillParams) => {
    const services: DesktopAnalyticsDep = {
        analytics: mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>()),
    };
    const setFractionButton = mock<TradingUseFormActionsReturnProps['setFractionButton']>();

    const view = renderHook(
        () => {
            const methods = useForm<TradingAllFormProps>({ defaultValues });
            mockUseTradingFormContext.mockReturnValue({
                ...methods,
                type,
                amountLimits,
                form: { helpers: { setFractionButton } },
            });

            return { methods, fillAmountLimit: useTradingAmountLimitFill(hookParams) };
        },
        {
            wrapper: ({ children }: PropsWithChildren) => (
                <ServicesProvider services={services}>{children}</ServicesProvider>
            ),
        },
    );

    return { ...view, analytics: services.analytics, setFractionButton };
};

const sellCryptoMinimum: RenderAmountLimitFillParams = {
    type: 'sell',
    amountLimits: { currency: 'BTC', minCrypto: '0.002' },
    defaultValues: {
        outputs: [{ amount: '0.001', fiat: '25' }],
        [TRADING_FORM_AMOUNT_IN_CRYPTO]: false,
    },
    hookParams: {
        errorType: TRADING_CRYPTO_LIMITS_RULE,
        cryptoInputName: TRADING_FORM_OUTPUT_AMOUNT,
        fiatInputName: TRADING_FORM_OUTPUT_FIAT,
        isInSats: false,
        cryptoDecimals: 8,
    },
};

describe(useTradingAmountLimitFill.name, () => {
    it('fills the crypto minimum and makes the crypto amount the source of the trade', () => {
        const { result, setFractionButton } = renderAmountLimitFill(sellCryptoMinimum);

        act(() => result.current.fillAmountLimit?.());

        const { getValues } = result.current.methods;
        expect(getValues(TRADING_FORM_OUTPUT_AMOUNT)).toBe('0.002');
        expect(getValues(TRADING_FORM_OUTPUT_FIAT)).toBe('');
        expect(getValues(TRADING_FORM_AMOUNT_IN_CRYPTO)).toBe(true);
        expect(getValues(TRADING_FORM_AMOUNT_INPUT_SOURCE)).toBe('crypto');
        expect(setFractionButton).toHaveBeenCalledWith(undefined);
    });

    it('fills the fiat maximum and makes the fiat amount the source of the trade', () => {
        const { result, setFractionButton } = renderAmountLimitFill({
            type: 'buy',
            amountLimits: { currency: 'BTC', maxFiat: '1000' },
            defaultValues: {
                [TRADING_FORM_FIAT_INPUT]: '5000',
                [TRADING_FORM_CRYPTO_INPUT]: '0.1',
                [TRADING_FORM_AMOUNT_IN_CRYPTO]: true,
            },
            hookParams: {
                errorType: TRADING_FIAT_MAX_RULE,
                cryptoInputName: TRADING_FORM_CRYPTO_INPUT,
                fiatInputName: TRADING_FORM_FIAT_INPUT,
                isInSats: false,
                cryptoDecimals: 8,
            },
        });

        act(() => result.current.fillAmountLimit?.());

        const { getValues } = result.current.methods;
        expect(getValues(TRADING_FORM_FIAT_INPUT)).toBe('1000');
        expect(getValues(TRADING_FORM_CRYPTO_INPUT)).toBe('');
        expect(getValues(TRADING_FORM_AMOUNT_IN_CRYPTO)).toBe(false);
        expect(getValues(TRADING_FORM_AMOUNT_INPUT_SOURCE)).toBe('fiat');
        expect(setFractionButton).not.toHaveBeenCalled();
    });

    it('reports the filled limit and names the exchange form a swap', () => {
        const { result, analytics } = renderAmountLimitFill({
            ...sellCryptoMinimum,
            type: 'exchange',
        });

        act(() => result.current.fillAmountLimit?.());

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'trading/amount-limit-fill',
            payload: { type: 'swap', limit: 'min', amountType: 'crypto' },
        });
    });

    it('offers nothing to fill for an error that is not a limit', () => {
        const { result } = renderAmountLimitFill({
            ...sellCryptoMinimum,
            hookParams: { ...sellCryptoMinimum.hookParams, errorType: 'decimals' },
        });

        expect(result.current.fillAmountLimit).toBeUndefined();
    });
});
