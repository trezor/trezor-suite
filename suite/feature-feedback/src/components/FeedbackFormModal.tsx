import { useState } from 'react';

import { type FeedbackFeatureName, translatedFeedbackFeatures } from '@suite/experimental';
import { Translation, useTranslation } from '@suite/intl';
import { type Rating } from '@suite-common/feedback';
import { Card, Column, Modal, Paragraph, Textarea } from '@trezor/components';
import { EmojiRatingSelector } from '@trezor/product-components';

export interface FeedbackFormModalProps {
    feature: FeedbackFeatureName;
    onDismiss: () => void;
    onSubmit: (rating: Rating, description: string) => void;
}

export const FeedbackFormModal = ({ onDismiss, onSubmit, feature }: FeedbackFormModalProps) => {
    const { translationString } = useTranslation();

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
            heading={
                <Translation
                    id="TR_FEATURE_FEEDBACK_MODAL_HEADING"
                    values={{
                        feature: translationString(translatedFeedbackFeatures[feature]),
                    }}
                />
            }
            bottomContent={
                <>
                    <Modal.Button isDisabled={!isFormValid} onClick={handleSubmit}>
                        <Translation id="TR_FEATURE_FEEDBACK_MODAL_SUBMIT" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onDismiss}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            onCancel={onDismiss}
            intent="brand"
        >
            <Card>
                <Column gap={16} alignItems="start">
                    <EmojiRatingSelector value={rating} onChange={setRating} />

                    <Paragraph typographyStyle="body-sm">
                        <Translation id="TR_FEATURE_FEEDBACK_MODAL_DESCRIPTION" />
                    </Paragraph>

                    <Textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        characterCount
                        maxLength={1000}
                    />
                </Column>
            </Card>
        </Modal>
    );
};
