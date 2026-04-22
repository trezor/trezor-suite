import { type ReactNode } from 'react';

import { useDevice } from '@suite/device';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Banner, type BannerIntent } from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { WebUsbButton } from 'src/components/suite/WebUsbButton';
import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

import { AcquireDeviceButton } from '../suite/AcquireDeviceButton';

type DeviceBannerProps = {
    title: ReactNode;
    description?: ReactNode;
    intent?: BannerIntent;
    rightContent?: ReactNode;
};

export const DeviceBanner = ({
    title,
    description,
    intent = 'warning',
    rightContent,
}: DeviceBannerProps) => {
    const { device } = useDevice();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const deviceConnectedButNotAcquired = device && !isDeviceAcquired(device);
    const selectedDeviceModelInternal = device?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Banner
            data-testid="@settings/device/disconnected-device-banner"
            intent={intent}
            icon={mapTrezorModelToIcon[selectedDeviceModelInternal]}
            title={title}
            description={description}
            rightContent={
                rightContent ?? (
                    <>
                        {deviceConnectedButNotAcquired && <AcquireDeviceButton />}
                        {isWebUsbTransport && !device?.connected && (
                            <WebUsbButton intent={intent} size="small" />
                        )}
                    </>
                )
            }
        />
    );
};
