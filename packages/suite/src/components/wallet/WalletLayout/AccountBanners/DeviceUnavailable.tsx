import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useDispatch } from 'src/hooks/suite';

export const DeviceUnavailable = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const passphraseProtection = !!device?.features?.passphrase_protection;

    if (!device?.connected || device.available || !device.features || passphraseProtection) {
        return null;
    }

    const handleButtonClick = () => dispatch(applySettings({ use_passphrase: true }));

    return (
        <Banner
            intent="info"
            rightContent={
                <Banner.Button onClick={handleButtonClick} isLoading={isLocked()}>
                    <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
                </Banner.Button>
            }
            description={<Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />}
        />
    );
};
