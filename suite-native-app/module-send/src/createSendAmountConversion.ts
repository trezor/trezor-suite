import { toTokenAddress } from '@suite-common/tokens';
import {
    selectAccountNetworkSymbol,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getFiatRateKey,
    isTestnet,
    parseCryptoToFormattedBaseCurrency,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type UseFormReturn } from '@suite-native/forms';
import { type GetStateDep } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { type SendOutputsFormValues } from './sendOutputsFormSchema';
import { getOutputFieldName } from './utils';

export type SendAmountConversionDeps = GetStateDep & {
    form: Pick<UseFormReturn<SendOutputsFormValues>, 'getValues' | 'setValue'>;
};

type SendAmountConversionParams = {
    amount: string;
    recipientIndex: number;
};

export type SendAmountConversion = {
    updateFiatAmount: (params: SendAmountConversionParams) => void;
    prefillAmount: (params: SendAmountConversionParams) => void;
};

export const createSendAmountConversion = (
    deps: SendAmountConversionDeps,
    accountKey: AccountKey,
): SendAmountConversion => {
    /**
     * Updates only fiat from a crypto amount already expressed in the form's display unit
     * (BTC or sats, depending on settings). Used after typing updates the crypto field.
     * Clears fiat when the amount or exchange rate cannot be converted.
     */
    const updateFiatAmount: SendAmountConversion['updateFiatAmount'] = ({
        amount,
        recipientIndex,
    }) => {
        const state = deps.getState();
        const symbol = selectAccountNetworkSymbol(state, accountKey);
        const fiatField = getOutputFieldName(recipientIndex, 'fiat');
        deps.form.setValue(fiatField, '');

        const value = new BigNumber(amount);
        if (!amount || !value.isFinite() || !symbol || isTestnet(symbol)) return;

        // A scanned URI can change the token in the same event, before React renders again.
        const token = deps.form.getValues(getOutputFieldName(recipientIndex, 'token'));
        const baseCurrencyCode = selectBaseCurrency(state);
        const rate = selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(symbol, baseCurrencyCode, token ? toTokenAddress(token) : undefined),
        );
        if (
            !rate ||
            rate.error ||
            typeof rate.rate !== 'number' ||
            !Number.isFinite(rate.rate) ||
            rate.rate <= 0
        )
            return;

        deps.form.setValue(
            fiatField,
            parseCryptoToFormattedBaseCurrency({
                value,
                symbol,
                rate: rate.rate,
                baseCurrencyCode,
                areSatsDisplayed: selectIsBaseCurrencyInSats(state),
                baseCurrencyToSats: selectIsAmountInSats(state, symbol),
            }) ?? '',
        );
    };

    /**
     * Fills crypto and fiat from a QR/payment URI or navigation amount in whole crypto units.
     * Converts BTC to sats when needed, writes and validates the crypto field, then calls
     * updateFiatAmount with the displayed amount.
     */
    const prefillAmount: SendAmountConversion['prefillAmount'] = ({ amount, recipientIndex }) => {
        const state = deps.getState();
        const symbol = selectAccountNetworkSymbol(state, accountKey);
        const displayAmount =
            amount && symbol && selectIsAmountInSats(state, symbol)
                ? unitsToSubunits({ value: asAmountUnit(new BigNumber(amount)), symbol }).toString()
                : amount;

        deps.form.setValue(getOutputFieldName(recipientIndex, 'amount'), displayAmount, {
            shouldValidate: true,
        });
        updateFiatAmount({ amount: displayAmount, recipientIndex });
    };

    return { updateFiatAmount, prefillAmount };
};
