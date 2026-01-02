import { ReactNode } from 'react';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Banner, Column, H4, Paragraph } from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { WebUsbButton } from 'src/components/suite/WebUsbButton';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

import { AcquireDeviceButton } from '../suite/AcquireDeviceButton';

type DeviceBannerProps = {
    title: ReactNode;
    description?: ReactNode;
};

export const DeviceBanner = ({ title, description }: DeviceBannerProps) => {
    const { device } = useDevice();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const deviceConnectedButNotAcquired = device && !isDeviceAcquired(device);
    const selectedDeviceModelInternal = device?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Banner
            data-testid="@settings/device/disconnected-device-banner"
            intent="warning"
            icon={mapTrezorModelToIcon[selectedDeviceModelInternal]}
            rightContent={
                <>
                    {deviceConnectedButNotAcquired && <AcquireDeviceButton />}
                    {isWebUsbTransport && !device?.connected && (
                        <WebUsbButton intent="warning" size="small" />
                    )}
                </>
            }
        >
            <Column>
                <H4>{title}</H4>
                {description && <Paragraph>{description}</Paragraph>}
            </Column>
        </Banner>
    );
};
