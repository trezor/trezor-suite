import { createFormControl } from 'react-hook-form';

import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';

import {
    type SendAmountConversionDeps,
    createSendAmountConversion,
} from './createSendAmountConversion';
import { type SendOutputsFormValues } from './sendOutputsFormSchema';

type SetupParams = {
    symbol?: NetworkSymbol;
    rate?: number;
    error?: string;
    token?: TokenAddress;
    bitcoinAmountUnit?: PROTO.AmountUnit;
};

const setup = ({
    symbol = asNetworkSymbol('btc'),
    rate = 20000,
    error,
    token,
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
}: SetupParams = {}) => {
    const account = mockWalletAccount({ symbol });
    const form = createFormControl<SendOutputsFormValues>({
        defaultValues: {
            outputs: [
                { amount: '1', fiat: 'original', address: '', token: null },
                { amount: '', fiat: 'stale', address: '', token: token || null },
            ],
        },
    });
    form.subscribe({ formState: { values: true }, callback: () => {} });
    const state = {
        wallet: {
            accounts: [account],
            settings: { localCurrency: 'usd', bitcoinAmountUnit },
            fiat: {
                current: {
                    [getFiatRateKey(symbol, 'usd', token || undefined)]: { rate, error },
                },
            },
        },
    };
    const deps: SendAmountConversionDeps = { form, getState: mock(() => state) };

    return { form, state, conversion: createSendAmountConversion(deps, account.key) };
};

describe('createSendAmountConversion', () => {
    it('prefills crypto and fiat for the selected recipient only', () => {
        const { form, conversion } = setup();

        conversion.prefillAmount({ amount: '0.5', recipientIndex: 1 });

        expect(form.getValues('outputs.1.amount')).toBe('0.5');
        expect(form.getValues('outputs.1.fiat')).toBe('10000.00');
        expect(form.getValues('outputs.0')).toEqual({
            amount: '1',
            fiat: 'original',
            address: '',
            token: null,
        });
    });

    it('converts whole Bitcoin prefills to sats before computing fiat', () => {
        const { form, conversion } = setup({ bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI });

        conversion.prefillAmount({ amount: '0.5', recipientIndex: 1 });

        expect(form.getValues('outputs.1.amount')).toBe('50000000');
        expect(form.getValues('outputs.1.fiat')).toBe('10000.00');
    });

    it('treats typed crypto as the displayed unit and leaves crypto untouched', () => {
        const { form, conversion } = setup({ bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI });

        conversion.updateFiatAmount({ amount: '50000000', recipientIndex: 1 });

        expect(form.getValues('outputs.1.amount')).toBe('');
        expect(form.getValues('outputs.1.fiat')).toBe('10000.00');
    });

    it('reads the current token and state for each conversion', () => {
        const token = toTokenAddress('0x123');
        const symbol = asNetworkSymbol('eth');
        const { form, state, conversion } = setup({ symbol, token, rate: 2 });
        // QR parsing updates the token before React has rendered again.
        form.setValue('outputs.1.token', null);
        conversion.prefillAmount({ amount: '3', recipientIndex: 1 });
        expect(form.getValues('outputs.1.fiat')).toBe('');

        form.setValue('outputs.1.token', token);
        state.wallet.fiat.current[getFiatRateKey(symbol, 'usd', token)] = {
            rate: 4,
            error: undefined,
        };
        conversion.prefillAmount({ amount: '3', recipientIndex: 1 });
        expect(form.getValues('outputs.1.fiat')).toBe('12.00');
    });

    it.each(['', 'invalid', 'Infinity'])('clears stale fiat for amount %p', amount => {
        const { form, conversion } = setup();
        conversion.updateFiatAmount({ amount, recipientIndex: 1 });
        expect(form.getValues('outputs.1.fiat')).toBe('');
    });

    it.each([0, -1, NaN, Infinity])('clears stale fiat for rate %p', rate => {
        const { form, conversion } = setup({ rate });
        conversion.prefillAmount({ amount: '1', recipientIndex: 1 });
        expect(form.getValues('outputs.1.amount')).toBe('1');
        expect(form.getValues('outputs.1.fiat')).toBe('');
    });

    it('clears stale fiat when a rate has an error', () => {
        const { form, conversion } = setup({ error: 'unavailable' });
        conversion.prefillAmount({ amount: '1', recipientIndex: 1 });
        expect(form.getValues('outputs.1.fiat')).toBe('');
    });

    it('does not convert testnet amounts', () => {
        const { form, conversion } = setup({ symbol: asNetworkSymbol('test') });
        conversion.prefillAmount({ amount: '1', recipientIndex: 1 });
        expect(form.getValues('outputs.1.fiat')).toBe('');
    });
});
