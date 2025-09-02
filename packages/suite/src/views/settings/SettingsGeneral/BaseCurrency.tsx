import { useMemo } from 'react';

import { selectBaseCurrency, setBaseCurrency } from '@suite-common/wallet-core';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    buildCurrencyOptions,
    buildShortCurrencyOption,
} from 'src/views/wallet/send/Outputs/Amount/BaseCurrencySelect';

export const BaseCurrency = () => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { areSatsDisplayed } = useBitcoinAmountUnit();
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

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
        () => buildCurrencyOptions({ translationString, areSatsDisplayed }),
        [translationString, areSatsDisplayed],
    );

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Fiat}>
            <TextColumn title={<Translation id="TR_BASE_CURRENCY" />} />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    onChange={handleChange}
                    value={buildShortCurrencyOption({
                        currency: baseCurrencyCode,
                        areSatsDisplayed,
                    })}
                    options={options}
                    data-testid="@settings/fiat-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
