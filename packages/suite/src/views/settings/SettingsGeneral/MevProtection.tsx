import { FormattedList } from 'react-intl';

import { networksCollection } from '@suite-common/wallet-config';
import { WALLET_SETTINGS, selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const MevProtection = () => {
    const dispatch = useDispatch();
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);

    const supportedNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);

    const handleSubmit = () => {
        dispatch({
            type: WALLET_SETTINGS.SET_MEV_PROTECTION,
            payload: !isMevProtectionEnabled,
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
                    onChange={handleSubmit}
                    data-testid="@settings/auto-eject-switch"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
