import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { isDeviceInBootloaderMode } from '@trezor/device-utils';
import { SectionItem } from '@trezor/product-components';

import { WipeDeviceModal } from './WipeDeviceModal';

interface WipeDeviceProps {
    isDeviceLocked: boolean;
}

export const WipeDevice = ({ isDeviceLocked }: WipeDeviceProps) => {
    const { device } = useDevice();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const headingTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <Anchor anchorId={SettingsAnchor.WipeDevice}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <>
                    {isModalOpen && <WipeDeviceModal onCancel={() => setIsModalOpen(false)} />}
                    <SectionItem
                        data-testid={anchorId}
                        ref={anchorRef}
                        shouldHighlight={shouldHighlight}
                        title={<Translation id={headingTranslation} />}
                        description={
                            <Translation
                                id={
                                    isBootloaderMode
                                        ? 'TR_FACTORY_RESET_DESCRIPTION'
                                        : 'TR_WIPE_DEVICE_DESCRIPTION'
                                }
                            />
                        }
                        actions={
                            <SectionItem.Button
                                onClick={() => setIsModalOpen(true)}
                                intent="critical"
                                isDisabled={isDeviceLocked}
                                data-testid="@settings/device/open-wipe-modal-button"
                                isTooltipActive={isDeviceLocked}
                                tooltipContent={
                                    <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                }
                            >
                                <Translation id={headingTranslation} />
                            </SectionItem.Button>
                        }
                    />
                </>
            )}
        </Anchor>
    );
};
