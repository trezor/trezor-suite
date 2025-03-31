import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch } from '../../../../hooks/suite';
import { Translation } from '../../Translation';
import { TrezorLink } from '../../TrezorLink';

export const BluetoothSettingsDescription = () => {
    const dispatch = useDispatch();

    const handleClick = async () => {
        const opened = await desktopApi.openSystemSettings('bluetooth');
        if (!opened.success) {
            dispatch(
                notificationsActions.addToast({ type: 'cannot-open-bluetooth-settings-error' }),
            );
        }
    };

    return (
        <Translation
            id="TR_BLUETOOTH_TIP_SETTINGS_TEXT"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" onClick={handleClick}>
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    );
};
