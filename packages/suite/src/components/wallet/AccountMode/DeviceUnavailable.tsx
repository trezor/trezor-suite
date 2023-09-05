import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { NotificationCard, Translation } from 'src/components/suite';

const DeviceUnavailable = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    if (!device?.connected || device.available) return null;

    const handleButtonClick = () => dispatch(applySettings({ use_passphrase: true }));

    return (
        <NotificationCard
            variant="info"
            button={{
                children: <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />,
                isLoading: isLocked(),
                onClick: handleButtonClick,
            }}
        >
            <Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />
        </NotificationCard>
    );
};

export default DeviceUnavailable;
