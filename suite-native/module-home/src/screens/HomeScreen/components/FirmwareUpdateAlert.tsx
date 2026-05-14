import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import { selectDeviceId, selectDeviceUpdateFirmwareVersion } from '@suite-common/device';
import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type CloseStateItem = {
    deviceId: string;
    version: string;
};
const closeStateAtom = atom<CloseStateItem[]>([]);

export const FirmwareUpdateAlert = () => {
    const { translate } = useTranslate();
    const updateFirmwareVersion = useSelector(selectDeviceUpdateFirmwareVersion);
    const deviceId = useSelector(selectDeviceId);
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();
    const setCloseState = useSetAtom(closeStateAtom);

    const isClosedAtom = useMemo(
        () =>
            atom(get =>
                get(closeStateAtom).some(
                    item => item.deviceId === deviceId && item.version === updateFirmwareVersion,
                ),
            ),
        [deviceId, updateFirmwareVersion],
    );

    const isClosed = useAtomValue(isClosedAtom);

    const handleUpdateFirmware = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceFirmware,
            params: { closeActionType: 'close' },
        });
    };

    const handleClose = () => {
        if (!deviceId || !updateFirmwareVersion) return;

        setCloseState(prev => [...prev, { deviceId, version: updateFirmwareVersion }]);
    };

    if (isClosed) {
        return null;
    }

    return (
        <AnimatedFullAlertBox
            title={<Translation id="moduleHome.firmwareUpdateAlert.title" />}
            description={
                <Translation
                    id="moduleHome.firmwareUpdateAlert.version"
                    values={{ version: updateFirmwareVersion }}
                />
            }
            variant="info"
            secondaryButtonLabel={translate('moduleHome.firmwareUpdateAlert.button.close')}
            onPressSecondaryButton={handleClose}
            primaryButtonLabel={translate('moduleHome.firmwareUpdateAlert.button.update')}
            onPressPrimaryButton={handleUpdateFirmware}
            marginHorizontal="sp16"
        />
    );
};
