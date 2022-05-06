import React from 'react';
import styled from 'styled-components';
import { Translation, Modal, HomescreenGallery } from '@suite-components';
import { AcquiredDevice } from '@suite-types';

const StyledModal = styled(Modal)`
    width: 600px;
`;

type BackgroundGalleryProps = {
    device: AcquiredDevice;
    onCancel: () => void;
};

export const BackgroundGallery = ({ device, onCancel }: BackgroundGalleryProps) => (
    <StyledModal
        isCancelable
        onCancel={onCancel}
        heading={<Translation id="TR_BACKGROUND_GALLERY" />}
    >
        <HomescreenGallery device={device} />
    </StyledModal>
);
