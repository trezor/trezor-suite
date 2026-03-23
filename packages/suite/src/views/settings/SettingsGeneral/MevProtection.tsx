import { FormattedList } from 'react-intl';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const MevProtection = () => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);

    const supportedNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);

    const handleSwitchChange = () => {
        const nextIsMevProtectionEnabled = !isMevProtectionEnabled;

        dispatch(setMevProtection(nextIsMevProtectionEnabled));

        analytics.report({
            type: events.settingsGeneralMevProtectionEvent.name,
            payload: { value: nextIsMevProtectionEnabled },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.MevProtection}>
            <TextColumn
                title={<Translation id="TR_MEV" />}
                description={
                    <>
                        <Translation id="TR_MEV_DESCRIPTION" />
                        <br />
                        <Translation
                            id="TR_MEV_AVAILABLE_ON"
                            values={{
                                supportedNetworks: (
                                    <FormattedList type="conjunction" value={supportedNetworks} />
                                ),
                            }}
                        />
                    </>
                }
            />
            <ActionColumn>
                <Switch
                    isChecked={isMevProtectionEnabled}
                    onChange={handleSwitchChange}
                    data-testid="@settings/auto-eject-switch"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
