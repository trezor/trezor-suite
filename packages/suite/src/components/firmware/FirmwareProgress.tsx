import React from 'react';
import styled from 'styled-components';
import { getTextForStatus, getDescriptionForStatus } from '@firmware-utils';
import { Translation, WebusbButton } from '@suite-components';
import { Button } from '@trezor/components';
import { Loaders } from '@onboarding-components';
import { useDevice, useFirmware, useSelector } from '@suite-hooks';
import { InitImg, P, H2 } from '@firmware-components';
import { isWebUSB } from '@suite-utils/transport';

const ButtonWrapper = styled.div`
    margin-top: 16px;
`;

const Body = () => {
    const { device } = useDevice();
    const { status, prevDevice } = useFirmware();
    const { transport } = useSelector(state => ({
        transport: state.suite.transport,
    }));
    const webUsbTransport = isWebUSB(transport);

    const statusText = getTextForStatus(status);
    const statusDescription = getDescriptionForStatus(status, webUsbTransport);

    return (
        <>
            <InitImg
                model={device?.features?.major_version || prevDevice?.features?.major_version || 2}
            />

            {statusText && (
                <>
                    <H2>
                        <Translation id={statusText} />
                        <Loaders.Dots />
                    </H2>
                    {statusDescription && (
                        <P>
                            <Translation id={statusDescription} />
                        </P>
                    )}
                    {status === 'wait-for-reboot' && webUsbTransport && (
                        // Device needs to be paired twice when using web usb transport
                        // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for reboot,
                        // because Suite won't detect restarted device till it is paired again.
                        // That's why after restarting the device we need to allow user to pair it again.
                        <ButtonWrapper>
                            <WebusbButton ready>
                                <Button icon="SEARCH" variant="primary">
                                    <Translation id="TR_CHECK_FOR_DEVICES" />
                                </Button>
                            </WebusbButton>
                        </ButtonWrapper>
                    )}
                </>
            )}
        </>
    );
};

export const FirmwareProgressStep = {
    Body,
};
