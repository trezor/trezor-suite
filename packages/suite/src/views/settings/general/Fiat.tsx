import React from 'react';

import { FIAT } from 'src/config/suite';
import { Translation } from 'src/components/suite';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useSelector, useActions } from 'src/hooks/suite';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

import { analytics, EventType } from '@trezor/suite-analytics';
import { FiatCurrencyCode } from '@suite-common/suite-config';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const Fiat = () => {
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
                    hideTextCursor
                    useKeyPressScroll
                    onChange={(option: { value: FiatCurrencyCode; label: string }) => {
                        setLocalCurrency(option.value);
                        analytics.report({
                            type: EventType.SettingsGeneralChangeFiat,
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
