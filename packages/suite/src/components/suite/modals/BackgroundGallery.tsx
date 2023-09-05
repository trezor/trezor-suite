import { Translation, Modal, HomescreenGallery } from 'src/components/suite';

type BackgroundGalleryProps = {
    onCancel: () => void;
};

export const BackgroundGallery = ({ onCancel }: BackgroundGalleryProps) => (
    <Modal isCancelable onCancel={onCancel} heading={<Translation id="TR_HOMESCREEN_GALLERY" />}>
        <HomescreenGallery />
    </Modal>
);
