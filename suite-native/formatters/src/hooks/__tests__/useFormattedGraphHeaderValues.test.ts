import { type SupportedLocaleCode } from '@suite-native/intl';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { AmountUnit } from '@trezor/protobuf/src/definitions';

import { useFormattedGraphHeaderValues } from '../useFormattedGraphHeaderValues';

let store: TestStore;

const setNewStoreMockup = (preloadedState: any) => {
    store = createLightStore({
        reducer: {
            locale: localeReducer,
            wallet: createStaticReducer(preloadedState.wallet),
        },
        preloadedState: {
            ...preloadedState,
        },
    });
};

describe(useFormattedGraphHeaderValues.name, () => {
    const renderUseFormattedGraphHeaderValues = (value?: string) =>
        renderHookWithStoreProvider(() => useFormattedGraphHeaderValues(value), {
            providers: ['intl', 'formatter'],
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should parse balance amount correctly with valid input - english locale + USD', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'usd' } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: '$',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    it('parses balance amount correctly with valid input - english locale + CZK', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    it('parses balance amount correctly with valid input - czech locale + CZK', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'cs-CZ' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: 'Kč',
            wholeNumber: '1\u00a0234', // non-breaking space
            decimalNumber: ',56',
        });
    });

    it('parses balance amount correctly with valid input and no decimal part', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'eur' } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('2000');
        expect(result.current).toEqual({
            currencySymbol: '€',
            wholeNumber: '2,000',
            decimalNumber: '.00',
        });
    });

    it('parses balance amount correctly with valid input and only decimal part', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('0.99');
        expect(result.current).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '0',
            decimalNumber: '.99',
        });
    });

    it('handles BTC BaseCurrency correctly', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.BITCOIN } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('0.01');
        expect(result.current).toEqual({
            currencySymbol: 'BTC',
            wholeNumber: '0',
            decimalNumber: '.01',
        });
    });

    it('rounds BTC Crypto value correctly', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.BITCOIN } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('0.00124009');
        expect(result.current).toEqual({
            currencySymbol: 'BTC',
            wholeNumber: '0',
            decimalNumber: '.00',
        });
    });

    it('parses satoshis value correctly - english locale', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.SATOSHI } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('0.01477571');
        expect(result.current).toEqual({
            currencySymbol: 'sat',
            wholeNumber: '1,477,571',
            decimalNumber: '',
        });
    });

    it('parses satoshis value correctly - spanish locale', () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'es-ES' as SupportedLocaleCode },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.SATOSHI } },
        });
        const { result } = renderUseFormattedGraphHeaderValues('0.01477571');
        expect(result.current).toEqual({
            currencySymbol: 'sat',
            wholeNumber: '1.477.571',
            decimalNumber: '',
        });
    });
});
