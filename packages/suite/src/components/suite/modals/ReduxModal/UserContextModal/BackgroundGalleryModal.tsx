import { Translation } from '@suite/intl';
import { Card, Column, H4, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { HomescreenGallery } from 'src/components/suite/HomescreenGallery';
import { HomescreenGalleryGlobal } from 'src/components/suite/HomescreenGalleryGlobal';

type BackgroundGalleryModalProps = {
    onCancel: () => void;
    onConfirm?: () => void;
};

export const BackgroundGalleryModal = ({ onCancel, onConfirm }: BackgroundGalleryModalProps) => (
    <Modal heading={<Translation id="TR_HOMESCREEN_GALLERY" />} onCancel={onCancel} width={600}>
        <Column gap={spacings.lg}>
            <Card>
                <HomescreenGallery onConfirm={onConfirm} />
            </Card>
            <Column gap={spacings.sm}>
                <H4>Global (connect-flow demo)</H4>
                <Card>
                    <HomescreenGalleryGlobal onConfirm={onConfirm} />
                </Card>
            </Column>
        </Column>
    </Modal>
);
