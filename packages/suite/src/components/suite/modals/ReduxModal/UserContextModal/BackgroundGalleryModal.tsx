import { Translation } from '@suite/intl';
import { Card, Modal } from '@trezor/components';

import { HomescreenGallery } from 'src/components/suite/HomescreenGallery';

type BackgroundGalleryModalProps = {
    onCancel: () => void;
    onConfirm?: () => void;
};

export const BackgroundGalleryModal = ({ onCancel, onConfirm }: BackgroundGalleryModalProps) => (
    <Modal heading={<Translation id="TR_HOMESCREEN_GALLERY" />} onCancel={onCancel} width={600}>
        <Card>
            <HomescreenGallery onConfirm={onConfirm} />
        </Card>
    </Modal>
);
