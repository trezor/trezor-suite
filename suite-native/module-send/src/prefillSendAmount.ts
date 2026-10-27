import { type Store } from '@reduxjs/toolkit';

import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountNetworkSymbol,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { type AccountKey, toTokenAddress } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getFiatRateKey,
    isTestnet,
    parseCryptoToFormattedBaseCurrency,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type Control, type UseFormReturn } from '@suite-native/forms';
import { BigNumber } from '@trezor/utils';

import { type SendOutputsFormValues } from './sendOutputsFormSchema';
import { getOutputFieldName } from './utils';

type PrefillSendAmountParams = {
    form: Pick<
        UseFormReturn<SendOutputsFormValues>,
        'control' | 'getValues' | 'setValue' | 'subscribe'
    >;
    store: Pick<
        Store<AccountsRootState & FiatRatesRootState & WalletSettingsRootState>,
        'getState' | 'subscribe'
    >;
    accountKey: AccountKey;
    recipientIndex: number;
    amount: string;
};

// Form context wraps the methods; control identifies the same form across all its callers.
const pendingPrefills = new WeakMap<Control<SendOutputsFormValues>, Map<number, () => void>>();

export const cancelSendAmountPrefills = (control: Control<SendOutputsFormValues>) => {
    pendingPrefills.get(control)?.forEach(cancel => cancel());
    pendingPrefills.delete(control);
};

export const prefillSendAmount = ({
    form,
    store,
    accountKey,
    recipientIndex,
    amount,
}: PrefillSendAmountParams) => {
    pendingPrefills.get(form.control)?.get(recipientIndex)?.();

    const state = store.getState();
    const symbol = selectAccountNetworkSymbol(state, accountKey);
    const isAmountInSats = selectIsAmountInSats(state, symbol);
    const amountField = getOutputFieldName(recipientIndex, 'amount');
    const fiatField = getOutputFieldName(recipientIndex, 'fiat');
    const tokenField = getOutputFieldName(recipientIndex, 'token');
    const token = form.getValues(tokenField);
    const tokenContract = token ? toTokenAddress(token) : undefined;
    const value = new BigNumber(amount);
    const displayAmount =
        amount && isAmountInSats && symbol
            ? unitsToSubunits({ value: asAmountUnit(value), symbol }).toString()
            : amount;

    form.setValue(amountField, displayAmount, { shouldValidate: true });
    form.setValue(fiatField, '');

    if (!amount || !value.isFinite() || !symbol || isTestnet(symbol)) return;

    const getFiatAmount = (): string | null => {
        const currentState = store.getState();
        const baseCurrencyCode = selectBaseCurrency(currentState);
        const rate = selectFiatRatesByFiatRateKey(
            currentState,
            getFiatRateKey(symbol, baseCurrencyCode, tokenContract),
        );
        if (!rate || !Number.isFinite(rate.rate) || rate.rate <= 0 || rate.error) return null;

        return parseCryptoToFormattedBaseCurrency({
            value: new BigNumber(displayAmount),
            symbol,
            rate: rate.rate,
            baseCurrencyCode,
            areSatsDisplayed: selectIsBaseCurrencyInSats(currentState),
            baseCurrencyToSats: isAmountInSats,
        });
    };

    const fiat = getFiatAmount();
    if (fiat !== null) {
        form.setValue(fiatField, fiat);

        return;
    }

    const pending = pendingPrefills.get(form.control) ?? new Map<number, () => void>();
    pendingPrefills.set(form.control, pending);
    const unsubscribeCallbacks: (() => void)[] = [];
    let isPending = true;
    const cancel = () => {
        if (!isPending) return;

        isPending = false;
        unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
        pending.delete(recipientIndex);
        if (pending.size === 0) pendingPrefills.delete(form.control);
    };
    unsubscribeCallbacks.push(
        form.subscribe({
            name: [amountField, fiatField, tokenField, 'outputs', 'setMaxOutputId'],
            exact: true,
            formState: { values: true },
            callback: ({ name, values }) => {
                if (name !== 'setMaxOutputId' || values.setMaxOutputId === recipientIndex) cancel();
            },
        }),
    );
    unsubscribeCallbacks.push(
        store.subscribe(() => {
            if (!isPending) return;

            const currentState = store.getState();
            if (
                selectAccountNetworkSymbol(currentState, accountKey) !== symbol ||
                selectIsAmountInSats(currentState, symbol) !== isAmountInSats
            ) {
                cancel();

                return;
            }

            const updatedFiat = getFiatAmount();
            if (updatedFiat !== null) {
                cancel();
                form.setValue(fiatField, updatedFiat);
            }
        }),
    );
    pending.set(recipientIndex, cancel);
};
