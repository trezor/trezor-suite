import { type CryptoId } from 'invity-api';

import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingAssetSellOption,
    type TradingCountryOption,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    getSellActiveAmount,
    getSellActiveAmountField,
    isSellQuotesFetchAllowed,
} from './sellQuotesRequestUtils';

const btcSymbol = toNetworkSymbolNonTestnet('btc');

const sendCryptoSelect: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

const countrySelect: TradingCountryOption = {
    value: 'CZ',
    codeAlpha3: 'CZE',
    flag: '🇨🇿',
    name: 'Czechia',
    label: '🇨🇿 Czechia',
    shortLabel: '🇨🇿 CZE',
};

const baseValues: TradingSellFormProps = {
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '0.0015',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    countrySelect,
    countrySubdivisionSelect: undefined,
    sendCryptoSelect,
    amountInCrypto: true,
    paymentMethod: undefined,
    provider: undefined,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
};

const withOutput = (
    values: TradingSellFormProps,
    output: Partial<Pick<TradingSellFormProps['outputs'][number], 'amount' | 'fiat'>>,
): TradingSellFormProps => ({
    ...values,
    outputs: values.outputs.map(existingOutput => ({ ...existingOutput, ...output })),
});

describe('getSellActiveAmountField', () => {
    it('points to the crypto amount while the amount is entered in crypto', () => {
        expect(getSellActiveAmountField(baseValues)).toBe(TRADING_FORM_OUTPUT_AMOUNT);
    });

    it('points to the fiat amount while the amount is entered in fiat', () => {
        expect(getSellActiveAmountField({ ...baseValues, amountInCrypto: false })).toBe(
            TRADING_FORM_OUTPUT_FIAT,
        );
    });
});

describe('getSellActiveAmount', () => {
    it('reads the crypto side while the amount is entered in crypto', () => {
        expect(getSellActiveAmount(withOutput(baseValues, { amount: '0.5', fiat: '50' }))).toBe(
            '0.5',
        );
    });

    it('reads the fiat side while the amount is entered in fiat', () => {
        const values = withOutput(
            { ...baseValues, amountInCrypto: false },
            {
                amount: '0.5',
                fiat: '50',
            },
        );

        expect(getSellActiveAmount(values)).toBe('50');
    });
});

describe('isSellQuotesFetchAllowed', () => {
    it('allows fetch when required selects and a positive crypto amount are present', () => {
        expect(isSellQuotesFetchAllowed(baseValues)).toBe(true);
    });

    it('allows fetch using the fiat amount while the amount is entered in fiat', () => {
        const values = withOutput(
            { ...baseValues, amountInCrypto: false },
            {
                amount: '',
                fiat: '50',
            },
        );

        expect(isSellQuotesFetchAllowed(values)).toBe(true);
    });

    it('ignores the inactive side', () => {
        expect(isSellQuotesFetchAllowed(withOutput(baseValues, { amount: '', fiat: '50' }))).toBe(
            false,
        );
        expect(
            isSellQuotesFetchAllowed(
                withOutput({ ...baseValues, amountInCrypto: false }, { amount: '0.5', fiat: '' }),
            ),
        ).toBe(false);
    });

    it('blocks fetch when the send asset is missing', () => {
        expect(isSellQuotesFetchAllowed({ ...baseValues, sendCryptoSelect: undefined })).toBe(
            false,
        );
    });

    it('blocks fetch when the country subdivision is required but empty', () => {
        const values: TradingSellFormProps = {
            ...baseValues,
            countrySelect: { ...countrySelect, value: 'US', codeAlpha3: 'USA' },
            countrySubdivisionSelect: undefined,
        };

        expect(isSellQuotesFetchAllowed(values)).toBe(false);
    });

    it('blocks fetch when the active amount is zero', () => {
        expect(isSellQuotesFetchAllowed(withOutput(baseValues, { amount: '0' }))).toBe(false);
    });
});
