import {
    type BaseCurrencyCode,
    baseCurrencies,
    isBaseCurrencyCode,
} from '@trezor/blockchain-link-types';
import { typedObjectKeys } from '@trezor/utils';

import { isBaseCurrencyWithSats } from './baseCurrencyUtils';

export type BaseCurrencyOption = { value: BaseCurrencyCode | ''; label: string };

type BuildCurrencyOptionParams = {
    currency: BaseCurrencyCode | '' | undefined;
    areSatsDisplayed: boolean;
};

export const buildCurrencyShortOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams): BaseCurrencyOption => {
    if (!currency || !isBaseCurrencyCode(currency)) return { value: '', label: '' };

    return {
        value: currency,
        label:
            isBaseCurrencyWithSats(currency) && areSatsDisplayed ? 'sat' : currency.toUpperCase(),
    };
};

export const buildCurrencyLongOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams): BaseCurrencyOption => {
    const shortOption = buildCurrencyShortOption({ currency, areSatsDisplayed });

    if (!currency || !isBaseCurrencyCode(currency)) return shortOption;

    return {
        value: shortOption.value,
        label:
            shortOption.label +
            ' · ' +
            (isBaseCurrencyWithSats(currency) && areSatsDisplayed
                ? 'Satoshis'
                : baseCurrencies[currency].label),
    };
};

type BuildCurrencyOptionsParams = {
    selected: BaseCurrencyOption;
    areSatsDisplayed: boolean;
};

export const buildCurrencyOptions = ({
    selected,
    areSatsDisplayed,
}: BuildCurrencyOptionsParams): BaseCurrencyOption[] => {
    const result: BaseCurrencyOption[] = [];

    typedObjectKeys(baseCurrencies).forEach(currency => {
        if (selected.value === currency) {
            return;
        }

        result.push(buildCurrencyLongOption({ currency, areSatsDisplayed }));
    });

    return result;
};
