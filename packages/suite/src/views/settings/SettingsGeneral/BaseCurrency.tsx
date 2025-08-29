import { useMemo } from 'react';

import { selectBaseCurrency, setBaseCurrency } from '@suite-common/wallet-core';
import {
    BaseCurrency as BaseCurrencyType,
    BaseCurrencyCode,
    baseCurrencies,
    fiatBaseCurrencies,
    valuablesBaseCurrencies,
} from '@trezor/blockchain-link-types';
import { EventType, analytics } from '@trezor/suite-analytics';
import { typedObjectValues } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

const buildCurrencyOption = ({ code, label }: BaseCurrencyType) => ({
    value: code,
    label: `${code.toUpperCase()} · ${label}`,
});

export const BaseCurrency = () => {
    const { translationString } = useTranslation();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const value = buildCurrencyOption(baseCurrencies[baseCurrencyCode]);

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
                options: typedObjectValues(fiatBaseCurrencies).map(buildCurrencyOption),
            },
            {
                label: translationString('TR_BASE_CURRENCY_VALUABLES'),
                options: typedObjectValues(valuablesBaseCurrencies).map(buildCurrencyOption),
            },
        ],
        [translationString],
    );

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Fiat}>
            <TextColumn title={<Translation id="TR_BASE_CURRENCY" />} />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    onChange={handleChange}
                    value={value}
                    options={options}
                    data-testid="@settings/fiat-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
