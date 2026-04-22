import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { isDeviceInBootloaderMode } from '@trezor/device-utils';

import { WipeDeviceModal } from 'src/views/settings/SettingsDevice/WipeDevice/WipeDeviceModal';

export const FailedBackup = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { device } = useDevice();
    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const buttonTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <>
            {isModalOpen && <WipeDeviceModal onCancel={() => setIsModalOpen(false)} />}
            <Banner
                icon
                intent="critical"
                data-testid="@notification/failed-backup"
                rightContent={
                    <Banner.Button
                        onClick={() => setIsModalOpen(true)}
                        data-testid="@notification/failed-backup/continue-button"
                    >
                        <Translation id={buttonTranslation} />
                    </Banner.Button>
                }
                description={<Translation id="TR_FAILED_BACKUP" />}
            />
        </>
    );
};
