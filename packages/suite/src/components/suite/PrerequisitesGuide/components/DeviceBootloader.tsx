import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    trezorModel?: number;
}

/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */
const DeviceBootloader = ({ trezorModel }: Props) => (
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
            items={[
                {
                    key: 'device-bootloader',
                    heading: <Translation id="TR_RECONNECT_IN_NORMAL" />,
                    description:
                        trezorModel === 1 ? (
                            <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_1" />
                        ) : (
                            <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_2" />
                        ),
                },
            ]}
        />
    </Wrapper>
);

export default DeviceBootloader;
