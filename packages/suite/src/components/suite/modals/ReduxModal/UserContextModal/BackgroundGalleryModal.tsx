import { Card, Modal } from '@trezor/components';

import { HomescreenGallery, Translation } from 'src/components/suite';

type BackgroundGalleryModalProps = {
    onCancel: () => void;
};

export const BackgroundGalleryModal = ({ onCancel }: BackgroundGalleryModalProps) => (
    <Modal heading={<Translation id="TR_HOMESCREEN_GALLERY" />} onCancel={onCancel} size="small">
        <Card>
            <HomescreenGallery />
        </Card>
    </Modal>
);
