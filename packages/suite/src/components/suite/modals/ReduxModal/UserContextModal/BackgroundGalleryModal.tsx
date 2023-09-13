import { Translation, Modal, HomescreenGallery } from 'src/components/suite';

type BackgroundGalleryModalProps = {
    onCancel: () => void;
};

export const BackgroundGalleryModal = ({ onCancel }: BackgroundGalleryModalProps) => (
    <Modal isCancelable onCancel={onCancel} heading={<Translation id="TR_HOMESCREEN_GALLERY" />}>
        <HomescreenGallery />
    </Modal>
);
