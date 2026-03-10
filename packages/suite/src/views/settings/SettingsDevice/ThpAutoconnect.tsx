import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { removeThpCredentialsThunk, startThpAutoconnectThunk } from '@suite-common/thp';
import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const ThpAutoconnect = ({ isDeviceLocked }: PinProtectionProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const { device } = useDevice();

    if (device?.thp?.credentials === undefined) {
        return null;
    }

    const autoconnectCredentials = device.thp.credentials.filter(
        credential => credential?.autoconnect,
    );

    const isAutoconnectOn = autoconnectCredentials.length > 0;

    const handleChange = async () => {
        if (isAutoconnectOn) {
            await dispatch(
                removeThpCredentialsThunk({ device, credentials: autoconnectCredentials }),
            ).unwrap();
        } else {
            dispatch(startThpAutoconnectThunk({ device }));
        }

        analytics.report({
            type: events.settingsDeviceChangeThpAutoconnectEvent.name,
            payload: {
                action: isAutoconnectOn ? 'disable-autoconnect' : 'enable-autoconnect',
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.ThpAutoconnect}>
            <TextColumn
                title={<Translation id="TR_THP_SETTINGS_AUTO_CONNECT" />}
                description={<Translation id="TR_THP_SETTINGS_AUTO_CONNECT_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={isAutoconnectOn}
                    onChange={handleChange}
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/thp-autoconnect"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
