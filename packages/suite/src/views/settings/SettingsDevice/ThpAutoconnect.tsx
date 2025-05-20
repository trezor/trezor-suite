import { Switch } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { startThpAutoconnectThunk } from '../../../actions/thp/startThpAutoconnectThunk';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const ThpAutoconnect = ({ isDeviceLocked }: PinProtectionProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isAutoconnectOn =
        (device?.thp?.credentials ?? []).filter(credential => credential?.autoconnect)?.length > 0;

    const handleChange = () => {
        if (isAutoconnectOn) {
            // Todo: remove autoconnect => TrezorConnect.removeThoCredentials(...)
            // Todo: propagate data thpReducer.thpCredentals = thpCredentals.filter(cred => !cred.autconnect)
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
