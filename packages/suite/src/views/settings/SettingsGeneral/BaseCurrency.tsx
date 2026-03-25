import { useMemo } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectBaseCurrency, setBaseCurrency } from '@suite-common/wallet-core';
import { buildCurrencyLongOption, buildCurrencyShortOption } from '@suite-common/wallet-utils';
import {
    type BaseCurrencyCode,
    fiatBaseCurrencies,
    valuablesBaseCurrencies,
} from '@trezor/blockchain-link-types';
import { ActionColumn, ActionSelect, TextColumn } from '@trezor/product-components';
import { typedObjectKeys } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const BaseCurrency = () => {
    const analytics = useAnalytics();
    const { translationString } = useTranslation();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const value = buildCurrencyShortOption({ currency: baseCurrencyCode, areSatsDisplayed: false });

    const handleChange = (option: { value: BaseCurrencyCode; label: string }) => {
        dispatch(setBaseCurrency(option.value));
        analytics.report({
            type: events.settingsGeneralChangeFiatEvent.name,
            payload: {
                fiat: option.value,
            },
        });
    };

    const options = useMemo(
        () => [
            {
                label: translationString('TR_BASE_CURRENCY_FIAT'),
                options: typedObjectKeys(fiatBaseCurrencies).map(currency =>
                    buildCurrencyLongOption({ currency, areSatsDisplayed: false }),
                ),
            },
            {
                label: translationString('TR_BASE_CURRENCY_VALUABLES'),
                options: typedObjectKeys(valuablesBaseCurrencies).map(currency =>
                    buildCurrencyLongOption({ currency, areSatsDisplayed: false }),
                ),
            },
        ],
        [translationString],
    );

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Fiat}>
            <TextColumn title={<Translation id="TR_BASE_CURRENCY" />} />
            <ActionColumn>
                <ActionSelect
                    isSearchable
                    onChange={handleChange}
                    value={value}
                    options={options}
                    data-testid="@settings/fiat-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
