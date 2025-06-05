import { Switch } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { removeThpAutoconnectThunk } from '../../../actions/thp/removeThpAutoconnectThunk';
import { startThpAutoconnectThunk } from '../../../actions/thp/startThpAutoconnectThunk';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const ThpAutoconnect = ({ isDeviceLocked }: PinProtectionProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    if (device?.thp?.credentials === undefined) {
        return null;
    }

    const autoconnectCredentials = device.thp.credentials.filter(
        credential => credential?.autoconnect,
    );

    const isAutoconnectOn = autoconnectCredentials.length > 0;

    const handleChange = () => {
        if (isAutoconnectOn) {
            dispatch(removeThpAutoconnectThunk({ credentials: autoconnectCredentials }));
        } else {
            dispatch(startThpAutoconnectThunk());
        }

        analytics.report({
            type: EventType.SettingsDeviceChangeThpAutoconnect,
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
