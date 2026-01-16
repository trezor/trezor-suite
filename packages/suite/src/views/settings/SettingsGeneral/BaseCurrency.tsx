import { useMemo } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectBaseCurrency, setBaseCurrency } from '@suite-common/wallet-core';
import { buildCurrencyLongOption, buildCurrencyShortOption } from '@suite-common/wallet-utils';
import {
    BaseCurrencyCode,
    fiatBaseCurrencies,
    valuablesBaseCurrencies,
} from '@trezor/blockchain-link-types';
import { EventType, analytics } from '@trezor/suite-analytics';
import { typedObjectKeys } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const BaseCurrency = () => {
    const { translationString } = useTranslation();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const value = buildCurrencyShortOption({ currency: baseCurrencyCode, areSatsDisplayed: false });

    const handleChange = (option: { value: BaseCurrencyCode; label: string }) => {
        dispatch(setBaseCurrency(option.value));
        analytics.report({
            type: EventType.SettingsGeneralChangeFiat,
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
