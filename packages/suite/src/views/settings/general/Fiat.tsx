import React from 'react';

import { FIAT } from '@suite-config';
import { Translation } from '@suite-components';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnalytics, useSelector, useActions } from '@suite-hooks';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const Fiat = () => {
    const analytics = useAnalytics();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Fiat);

    const { localCurrency } = useSelector(state => ({
        localCurrency: state.wallet.settings.localCurrency,
    }));

    const { setLocalCurrency } = useActions({
        setLocalCurrency: walletSettingsActions.setLocalCurrency,
    });

    return (
        <SectionItem data-test="@settings/fiat" ref={anchorRef} shouldHighlight={shouldHighlight}>
            <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
            <ActionColumn>
                <ActionSelect
                    noTopLabel
                    hideTextCursor
                    useKeyPressScroll
                    onChange={(option: { value: string; label: string }) => {
                        setLocalCurrency(option.value);
                        analytics.report({
                            type: 'settings/general/change-fiat',
                            payload: {
                                fiat: option.value,
                            },
                        });
                    }}
                    value={buildCurrencyOption(localCurrency)}
                    options={FIAT.currencies.map(c => buildCurrencyOption(c))}
                    data-test="@settings/fiat-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
