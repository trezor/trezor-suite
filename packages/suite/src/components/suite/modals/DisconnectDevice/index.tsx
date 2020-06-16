import React from 'react';
import styled from 'styled-components';
import { Modal } from '@trezor/components';
import { Image, Translation } from '@suite-components';

const StyledImage = styled(Image)`
    flex: 1;
`;

const DisconnectDevice = () => {
    return (
        <Modal
            cancelable={false}
            size="tiny"
            heading={<Translation id="TR_DISCONNECT_YOUR_DEVICE" />}
            description={<Translation id="DISCONNECT_DEVICE_DESCRIPTION" />}
        >
            <StyledImage image="UNI_SUCCESS" />
        </Modal>
    );
};

export default DisconnectDevice;
