import { FiatCurrencyCode, fiatCurrencies } from '@suite-common/suite-config';
import { selectLocalCurrency, setLocalCurrency } from '@suite-common/wallet-core';
import { EventType, analytics } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const Fiat = () => {
    const localCurrency = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();

    const options = Object.keys(fiatCurrencies).map(c => buildCurrencyOption(c));
    const value = buildCurrencyOption(localCurrency);

    const handleChange = (option: { value: FiatCurrencyCode; label: string }) => {
        dispatch(setLocalCurrency(option.value));
        analytics.report({
            type: EventType.SettingsGeneralChangeFiat,
            payload: {
                fiat: option.value,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Fiat}>
            <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
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
