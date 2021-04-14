import React from 'react';
import { Translation, Modal, HomescreenGallery } from '@suite-components';
import { AcquiredDevice } from '@suite-types';

type Props = {
    device: AcquiredDevice;
    onCancel: () => void;
};

const BackgroundGallery = ({ device, onCancel }: Props) => (
    <Modal
        size="small"
        cancelable
        onCancel={onCancel}
        heading={<Translation id="TR_BACKGROUND_GALLERY" />}
    >
        <HomescreenGallery device={device} />
    </Modal>
);

export default BackgroundGallery;
