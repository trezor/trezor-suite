import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Rating } from '@suite-common/feedback';
import { Column, Modal, Paragraph, Textarea } from '@trezor/components';

import { EmojiRatingSelector } from './EmojiRatingSelector';

export interface FeedbackFormModalProps {
    onDismiss: () => void;
    onSubmit: (rating: Rating, description: string) => void;
}

export const FeedbackFormModal = ({ onDismiss, onSubmit }: FeedbackFormModalProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [description, setDescription] = useState('');

    const isFormValid = rating !== undefined && description.trim().length > 0;

    const handleSubmit = () => {
        if (!isFormValid) return;

        onSubmit(rating, description);
        onDismiss();
    };

    return (
        <Modal
            heading={<Translation id="TR_EXPERIMENTAL_FEEDBACK_MODAL_HEADING" />}
            bottomContent={
                <>
                    <Modal.Button isDisabled={!isFormValid} onClick={handleSubmit}>
                        <Translation id="TR_EXPERIMENTAL_FEEDBACK_MODAL_SUBMIT" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onDismiss}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            onCancel={onDismiss}
        >
            <Column gap={16} alignItems="start">
                <EmojiRatingSelector value={rating} onChange={setRating} />

                <Paragraph typographyStyle="body-sm">
                    <Translation id="TR_EXPERIMENTAL_FEEDBACK_MODAL_DESCRIPTION" />
                </Paragraph>

                <Textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    characterCount
                    maxLength={1000}
                />
            </Column>
        </Modal>
    );
};
