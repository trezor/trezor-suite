import { Banner } from '@trezor/components';

import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { Translation } from 'src/components/suite';

export const DeviceUnavailable = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    if (!device?.connected || device.available) return null;

    const handleButtonClick = () => dispatch(applySettings({ use_passphrase: true }));

    return (
        <Banner
            variant="info"
            rightContent={
                <Banner.Button onClick={handleButtonClick} isLoading={isLocked()}>
                    <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
                </Banner.Button>
            }
        >
            <Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />
        </Banner>
    );
};
