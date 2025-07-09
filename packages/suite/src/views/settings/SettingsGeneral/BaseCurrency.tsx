import { selectLocalCurrency, setLocalCurrency } from '@suite-common/wallet-core';
import { BaseCurrencyCode, baseCurrencies } from '@trezor/blockchain-link-types';
import { EventType, analytics } from '@trezor/suite-analytics';
import { typedObjectKeys } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';

const buildCurrencyOption = (currency: BaseCurrencyCode) => ({
    value: currency,
    label: currency.toUpperCase(),
});

const options = [
    {
        options: typedObjectKeys(baseCurrencies)
            .filter(it => it === 'btc')
            .map(c => buildCurrencyOption(c)),
    },
    {
        options: typedObjectKeys(baseCurrencies)
            .filter(it => it !== 'btc')
            .map(c => buildCurrencyOption(c)),
    },
];

export const BaseCurrency = () => {
    const localCurrency = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();

    const value = buildCurrencyOption(localCurrency);

    const handleChange = (option: { value: BaseCurrencyCode; label: string }) => {
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
