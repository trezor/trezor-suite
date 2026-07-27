import { useRef } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { getPackagingUrl } from '@suite-common/suite-utils';
import { Column, Image, Paragraph, Row } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { DeviceAnimation } from '@trezor/product-components';
import { TREZOR_RESELLERS_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';

export const Hologram = () => {
    const device = useSelector(selectSelectedDevice);
    const hologramRef = useRef<HTMLVideoElement>(null);

    const packagingUrl = getPackagingUrl(device);
    const deviceModelInternal = device?.features?.internal_model;
    const isOldT2B1Packaging =
        deviceModelInternal === DeviceModelInternal.T2B1 &&
        (device?.features?.unit_packaging === undefined || device?.features?.unit_packaging === 0);

    const isT1B1 = deviceModelInternal === DeviceModelInternal.T1B1;

    const getDeviceModel = () => {
        if (!deviceModelInternal || deviceModelInternal === DeviceModelInternal.UNKNOWN || isT1B1)
            return DEFAULT_FLAGSHIP_MODEL;

        if (deviceModelInternal === DeviceModelInternal.T2B1) return DeviceModelInternal.T3B1;

        return deviceModelInternal;
    };

    return (
        <Column gap={24}>
            <Paragraph>
                <Translation id="TR_HOLOGRAM_STEP_SUBHEADING" />
            </Paragraph>
            {isOldT2B1Packaging && (
                <Paragraph>
                    <Translation id="TR_HOLOGRAM_T2B1_NEW_SEAL" />
                </Paragraph>
            )}
            {isT1B1 ? (
                <DeviceAnimation
                    type="HOLOGRAM"
                    shape="ROUNDED-SMALL"
                    loop
                    width="100%"
                    deviceModelInternal={DeviceModelInternal.T1B1}
                    onVideoMouseOver={() => {
                        // If the video is placed in tooltip it stops playing after tooltip minimizes and won't start again
                        // As a quick workaround user can hover a mouse to play it again
                        hologramRef.current?.play();
                    }}
                    ref={hologramRef}
                />
            ) : (
                <Row justifyContent="center">
                    <Image image={`TREZOR_${getDeviceModel()}_HOLOGRAM`} />
                </Row>
            )}

            <Paragraph>
                <Translation
                    id="TR_SECURITY_CHECK_HOLOGRAM"
                    values={{
                        packaging: link => <TrezorLink href={packagingUrl}>{link}</TrezorLink>,
                        reseller: link => (
                            <TrezorLink href={TREZOR_RESELLERS_URL}>{link}</TrezorLink>
                        ),
                        support: link => <TrezorLink href={TREZOR_SUPPORT_URL}>{link}</TrezorLink>,
                    }}
                />
            </Paragraph>
        </Column>
    );
};
