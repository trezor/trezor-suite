import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';

import { type TradingSellFormProps } from '../src/types';

export const mockSellFormValues = (
    formValues: Partial<TradingSellFormProps> = {},
): TradingSellFormProps => ({
    ...DEFAULT_VALUES,
    options: ['broadcast'],
    selectedUtxos: [],
    outputs: [{ ...DEFAULT_PAYMENT, amount: '0.0005' }],
    sendCryptoSelect: undefined,
    countrySelect: {
        value: 'CZ',
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    amountInCrypto: true,
    ...formValues,
});
