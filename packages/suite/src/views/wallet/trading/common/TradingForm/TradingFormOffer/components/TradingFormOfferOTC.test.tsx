import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingOTC } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type CurrentRate } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingFormOfferOTC } from './TradingFormOfferOTC';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

const otcData: TradingOTC = {
    country: 'CZ',
    minFiatLimits: { eur: 50000 } as TradingOTC['minFiatLimits'],
    links: [{ name: 'otc-provider', url: 'https://otc.example', allowedCountries: ['CZ'] }],
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useFetchOtc: () => ({ data: otcData, isSuccess: true }),
}));

const BTC = asNetworkSymbol('btc');
const bitcoin = 'bitcoin' as CryptoId;

const buyContext = (cryptoInput: string) => {
    const values = {
        amountInCrypto: true,
        fiatInput: '',
        cryptoInput,
        currencySelect: { value: 'eur' },
        cryptoSelect: { id: bitcoin },
        countrySelect: { value: 'CZ' },
    };

    return {
        type: 'buy',
        getValues: (name?: keyof typeof values) => (name ? values[name] : values),
    };
};

const sellContext = (amount: string) => {
    const values = {
        amountInCrypto: true,
        outputs: [{ fiat: '', amount, currency: { value: 'eur' } }],
        sendCryptoSelect: { id: bitcoin },
        countrySelect: { value: 'CZ' },
    };

    return {
        type: 'sell',
        getValues: (name?: keyof typeof values) => (name ? values[name] : values),
    };
};

const renderBanner = (bitcoinAmountUnit: PROTO.AmountUnit) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                settings: {
                    ...mockInitialAppState.wallet.settings,
                    localCurrency: 'eur',
                    bitcoinAmountUnit,
                },
                fiat: {
                    ...mockInitialAppState.wallet.fiat,
                    current: {
                        [getFiatRateKey(BTC, 'eur')]: {
                            rate: 100000,
                            usdRate: 100000,
                        } as CurrentRate,
                    },
                },
            },
        },
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });
    renderWithProviders(services, <TradingFormOfferOTC />);
};

describe('TradingFormOfferOTC', () => {
    it.each([
        ['buy', 'sats', '1', false, buyContext('1'), PROTO.AmountUnit.SATOSHI],
        ['buy', 'sats', '100000000', true, buyContext('100000000'), PROTO.AmountUnit.SATOSHI],
        ['buy', 'BTC', '1', true, buyContext('1'), PROTO.AmountUnit.BITCOIN],
        ['buy', 'BTC', '0.1', false, buyContext('0.1'), PROTO.AmountUnit.BITCOIN],
        ['sell', 'sats', '1', false, sellContext('1'), PROTO.AmountUnit.SATOSHI],
        ['sell', 'sats', '100000000', true, sellContext('100000000'), PROTO.AmountUnit.SATOSHI],
    ] as const)(
        '%s in %s with amount %s shows the banner: %s',
        (_type, _unit, _amount, expectedShown, context, bitcoinAmountUnit) => {
            mockUseTradingFormContext.mockReturnValue(context);

            renderBanner(bitcoinAmountUnit);

            expect(!!screen.queryByText(/with Concierge/)).toBe(expectedShown);
        },
    );
});
