import { SupportedLocaleCode } from '@suite-native/intl';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { AmountUnit } from '@trezor/protobuf/src/messages';

import { useFormattedGraphHeaderValues } from '../useFormattedGraphHeaderValues';

let store: TestStore;

const setNewStoreMockup = (preloadedState: PreloadedState) => {
    store = initStore({
        ...preloadedState,
    }).store;
};

describe(useFormattedGraphHeaderValues.name, () => {
    const renderUseFormattedGraphHeaderValues = (value?: string) =>
        renderHookWithStoreProviderAsync(() => useFormattedGraphHeaderValues(value), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should parse balance amount correctly with valid input - english locale + USD', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'usd' } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: '$',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    it('parses balance amount correctly with valid input - english locale + CZK', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    it('parses balance amount correctly with valid input - czech locale + CZK', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'cs-CZ' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('1234.56');
        expect(result.current).toEqual({
            currencySymbol: 'Kč',
            wholeNumber: '1\u00a0234', // non-breaking space
            decimalNumber: ',56',
        });
    });

    it('parses balance amount correctly with valid input and no decimal part', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'eur' } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('2000');
        expect(result.current).toEqual({
            currencySymbol: '€',
            wholeNumber: '2,000',
            decimalNumber: '.00',
        });
    });

    it('parses balance amount correctly with valid input and only decimal part', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'czk' } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('0.99');
        expect(result.current).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '0',
            decimalNumber: '.99',
        });
    });

    it('handles BTC BaseCurrency correctly', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.BITCOIN } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('0.01');
        expect(result.current).toEqual({
            currencySymbol: 'BTC',
            wholeNumber: '0',
            decimalNumber: '.01',
        });
    });

    it('rounds BTC Crypto value correctly', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.BITCOIN } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('0.00124009');
        expect(result.current).toEqual({
            currencySymbol: 'BTC',
            wholeNumber: '0',
            decimalNumber: '.00',
        });
    });

    it('parses satoshis value correctly - english locale', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'en-US' },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.SATOSHI } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('0.01477571');
        expect(result.current).toEqual({
            currencySymbol: 'sat',
            wholeNumber: '1,477,571',
            decimalNumber: '',
        });
    });

    it('parses satoshis value correctly - spanish locale', async () => {
        setNewStoreMockup({
            locale: { appLocaleCode: 'es-ES' as SupportedLocaleCode },
            wallet: { settings: { localCurrency: 'btc', bitcoinAmountUnit: AmountUnit.SATOSHI } },
        });
        const { result } = await renderUseFormattedGraphHeaderValues('0.01477571');
        expect(result.current).toEqual({
            currencySymbol: 'sat',
            wholeNumber: '1.477.571',
            decimalNumber: '',
        });
    });
});
