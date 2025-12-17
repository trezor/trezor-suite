import { isRejected } from '@reduxjs/toolkit';

import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { removeThpAutoconnectThunk, startThpAutoconnectThunk } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const ThpAutoconnect = ({ isDeviceLocked }: PinProtectionProps) => {
    const legacyAnalytics = useLegacyAnalytics();
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
            const result = await dispatch(
                removeThpAutoconnectThunk({ credentials: autoconnectCredentials }),
            ).unwrap();

            if (isRejected(result) && result.error.message) {
                dispatch(
                    notificationsActions.addToast({ type: 'error', error: result.error.message }),
                );
            }
        } else {
            dispatch(startThpAutoconnectThunk({ device }));
        }

        legacyAnalytics.report({
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
