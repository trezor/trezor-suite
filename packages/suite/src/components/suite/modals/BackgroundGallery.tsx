import React from 'react';
import { Translation, Modal, HomescreenGallery } from '@suite-components';

type BackgroundGalleryProps = {
    onCancel: () => void;
};

export const BackgroundGallery = ({ onCancel }: BackgroundGalleryProps) => (
    <Modal isCancelable onCancel={onCancel} heading={<Translation id="TR_HOMESCREEN_GALLERY" />}>
        <HomescreenGallery />
    </Modal>
);
