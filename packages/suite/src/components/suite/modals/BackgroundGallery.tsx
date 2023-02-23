import React from 'react';
import { Translation, Modal, HomescreenGallery } from '@suite-components';
import { AcquiredDevice } from '@suite-types';

type BackgroundGalleryProps = {
    device: AcquiredDevice;
    onCancel: () => void;
};

export const BackgroundGallery = ({ device, onCancel }: BackgroundGalleryProps) => (
    <Modal isCancelable onCancel={onCancel} heading={<Translation id="TR_BACKGROUND_GALLERY" />}>
        <HomescreenGallery device={device} />
    </Modal>
);
