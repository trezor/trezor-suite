import { useForm } from 'react-hook-form';

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, asAccountDescriptor, toTokenAddress } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';

import { useSendAmountPrefill } from './useSendAmountPrefill';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';

type TestFormProps = {
    accountKey: AccountKey;
    recipientIndex: number;
};

const useTestForm = ({ accountKey, recipientIndex }: TestFormProps) => {
    const form = useForm<SendOutputsFormValues>({
        defaultValues: {
            isDestinationTagEnabled: false,
            outputs: [
                { address: '', amount: '1', fiat: '42', token: null },
                { address: '', amount: '2', fiat: '99', token: null },
            ],
        },
    });
    const prefill = useSendAmountPrefill({ form, accountKey, recipientIndex });
    const replacePrefill = useSendAmountPrefill({ form, accountKey, recipientIndex });

    return { form, prefill, replacePrefill };
};

type SetupParams = {
    rate?: number;
    symbol?: NetworkSymbol;
    isInSats?: boolean;
};

const setup = async ({
    rate,
    symbol = asNetworkSymbol('btc'),
    isInSats = false,
}: SetupParams = {}) => {
    const account = mockWalletAccount({ symbol });
    const otherAccount = mockWalletAccount({
        symbol,
        descriptor: asAccountDescriptor('anotherAccount'),
    });
    const rateKey = getFiatRateKey(symbol, 'usd');
    const wallet = createSlice({
        name: 'testWallet',
        initialState: {
            accounts: [account, otherAccount],
            settings: {
                localCurrency: 'usd',
                bitcoinAmountUnit: isInSats ? PROTO.AmountUnit.SATOSHI : PROTO.AmountUnit.BITCOIN,
            },
            fiat: { current: { [rateKey]: { rate } } },
        },
        reducers: {
            setRate: (state, action: PayloadAction<number>) => {
                state.fiat.current[rateKey] = { rate: action.payload };
            },
            setTokenRate: (state, action: PayloadAction<number>) => {
                state.fiat.current[getFiatRateKey(symbol, 'usd', toTokenAddress('0xtoken'))] = {
                    rate: action.payload,
                };
            },
        },
    });
    const store = createLightStore({
        reducer: {
            wallet: wallet.reducer,
            locale: createStaticReducer({ appLocaleCode: 'en', systemLocaleCode: 'en' }),
            discreetMode: createStaticReducer({ isActive: false }),
        },
    });
    const hook = await renderHookWithStoreProvider(useTestForm, {
        services: { store },
        initialProps: { accountKey: account.key, recipientIndex: 0 },
    });

    return { ...hook, store, actions: wallet.actions, account, otherAccount };
};

describe('useSendAmountPrefill', () => {
    it('preserves stored values until a prefill is requested', async () => {
        const { result } = await setup({ rate: 50000 });

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('42');
    });

    it('replaces stale fiat and preserves the full crypto amount and other recipients', async () => {
        const { result } = await setup({ rate: 50000 });

        await act(() => result.current.prefill('0.00012807'));

        expect(result.current.form.getValues('outputs.0.amount')).toBe('0.00012807');
        expect(result.current.form.getValues('outputs.0.fiat')).toBe('6.40');
        expect(result.current.form.getValues('outputs.1')).toMatchObject({
            amount: '2',
            fiat: '99',
        });

        await act(() => result.current.prefill('0'));
        expect(result.current.form.getValues('outputs.0.fiat')).toBe('0.00');
        await act(() => result.current.prefill(''));
        expect(result.current.form.getValues('outputs.0.fiat')).toBe('');
    });

    it.each([undefined, 0, NaN, Infinity, -1])(
        'waits for a valid rate when it is %s',
        async rate => {
            const { result, store, actions } = await setup({ rate });

            await act(() => result.current.prefill('0.00012807'));
            expect(result.current.form.getValues('outputs.0.fiat')).toBe('');

            await act(() => store.dispatch(actions.setRate(50000)));
            expect(result.current.form.getValues('outputs.0.fiat')).toBe('6.40');

            await act(() => store.dispatch(actions.setRate(60000)));
            expect(result.current.form.getValues('outputs.0.fiat')).toBe('6.40');
        },
    );

    it.each(['fiat', 'amount', 'token'] as const)(
        'cancels a delayed conversion after an edit to %s, even when the value is restored',
        async field => {
            const { result, store, actions } = await setup();
            await act(() => result.current.prefill('0.00012807'));

            await act(() => {
                const fieldName = `outputs.0.${field}` as const;
                const original = result.current.form.getValues(fieldName);
                result.current.form.setValue(fieldName, '1');
                result.current.form.setValue(fieldName, original);
            });
            await act(() => store.dispatch(actions.setRate(50000)));

            expect(result.current.form.getValues('outputs.0.fiat')).toBe('');
        },
    );

    it('keeps manually entered fiat precision when a delayed rate arrives', async () => {
        const { result, store, actions } = await setup();
        await act(() => result.current.prefill('0.00012807'));
        await act(() => result.current.form.setValue('outputs.0.fiat', '1.23456'));
        await act(() => store.dispatch(actions.setRate(50000)));

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('1.23456');
    });

    it('cancels pending conversion when Send Max is enabled', async () => {
        const { result, store, actions } = await setup();
        await act(() => result.current.prefill('0.00012807'));
        await act(() => result.current.form.setValue('setMaxOutputId', 0));
        await act(() => store.dispatch(actions.setRate(50000)));

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.form.getValues('setMaxOutputId')).toBe(0);
    });

    it('uses a replacement prefill and ignores edits to another recipient', async () => {
        const { result, store, actions } = await setup();
        await act(() => result.current.prefill('0.00012807'));
        await act(() => result.current.replacePrefill('0.001'));
        await act(() => result.current.form.setValue('outputs.1.fiat', '123'));
        await act(() => store.dispatch(actions.setRate(50000)));

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('50.00');
        expect(result.current.form.getValues('outputs.1.fiat')).toBe('123');
    });

    it('does not finish a prefill after the account or recipient changes', async () => {
        const { result, rerender, store, actions, otherAccount } = await setup();
        await act(() => result.current.prefill('0.00012807'));
        await rerender({ accountKey: otherAccount.key, recipientIndex: 1 });
        await act(() => store.dispatch(actions.setRate(50000)));

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.form.getValues('outputs.1.fiat')).toBe('99');
    });

    it('uses the token rate when the same QR changes token and amount', async () => {
        const { result, store, actions } = await setup({
            symbol: asNetworkSymbol('eth'),
            rate: 1000,
        });
        await act(() => store.dispatch(actions.setTokenRate(2)));
        await act(() => {
            result.current.form.setValue('outputs.0.token', '0xtoken');
            result.current.prefill('1.234567');
        });

        expect(result.current.form.getValues('outputs.0.amount')).toBe('1.234567');
        expect(result.current.form.getValues('outputs.0.fiat')).toBe('2.47');
    });

    it('converts URI bitcoin units to sats before filling the form', async () => {
        const { result } = await setup({ rate: 50000, isInSats: true });
        await act(() => result.current.prefill('0.00012807'));

        expect(result.current.form.getValues('outputs.0.amount')).toBe('12807');
        expect(result.current.form.getValues('outputs.0.fiat')).toBe('6.40');
    });

    it('keeps testnet fiat empty', async () => {
        const { result } = await setup({ symbol: asNetworkSymbol('test'), rate: 50000 });
        await act(() => result.current.prefill('0.001'));

        expect(result.current.form.getValues('outputs.0.fiat')).toBe('');
    });
});
