import React from 'react';
import styled from 'styled-components';
import { Modal } from '@trezor/components';
import { Image } from '@suite-components';

const StyledImage = styled(Image)`
    flex: 1;
`;

// todo: add translations

const DisconnectDevice = () => {
    return (
        <Modal
            cancelable={false}
            size="tiny"
            // heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
            // description={<Translation id="TR_PIN_MISMATCH_TEXT" />}
            heading="Disconnect your device"
            description="Your device was wiped. Disconnect it now."
        >
            <StyledImage image="UNI_SUCCESS" />
        </Modal>
    );
};

export default DisconnectDevice;
