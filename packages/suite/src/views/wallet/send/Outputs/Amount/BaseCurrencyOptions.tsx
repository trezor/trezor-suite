import { isBaseCurrencyWithSats } from '@suite-common/wallet-utils';
import {
    BaseCurrencyCode,
    baseCurrencies,
    fiatBaseCurrencies,
    valuablesBaseCurrencies,
} from '@trezor/blockchain-link-types';
import { typedObjectKeys } from '@trezor/utils';

const CURRENCY_SEPARATOR = ' · ';

type BuildCurrencyOptionParams = {
    currency: BaseCurrencyCode | '';
    areSatsDisplayed: boolean;
};

export const buildFullCurrencyOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams) => {
    if (currency === '')
        return {
            value: '',
            label: '',
        };
    else
        return {
            value: currency,
            label:
                isBaseCurrencyWithSats(currency) && areSatsDisplayed
                    ? `SATS${CURRENCY_SEPARATOR}Satoshis`
                    : `${currency.toUpperCase()}${CURRENCY_SEPARATOR}${baseCurrencies[currency].label}`,
        };
};

export const buildShortCurrencyOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams) => {
    const option = buildFullCurrencyOption({ currency, areSatsDisplayed });

    return {
        value: option.value,
        label: option.label.split(CURRENCY_SEPARATOR)[0],
    };
};

type BuildCurrencyOptionsParams = {
    translationString: any;
    areSatsDisplayed: boolean;
};

export const buildCurrencyOptions = ({
    translationString,
    areSatsDisplayed,
}: BuildCurrencyOptionsParams) => [
    {
        label: translationString('TR_BASE_CURRENCY_FIAT'),
        options: typedObjectKeys(fiatBaseCurrencies).map(currency =>
            buildFullCurrencyOption({ currency, areSatsDisplayed }),
        ),
    },
    {
        label: translationString('TR_BASE_CURRENCY_VALUABLES'),
        options: typedObjectKeys(valuablesBaseCurrencies).map(currency =>
            buildFullCurrencyOption({ currency, areSatsDisplayed }),
        ),
    },
];
