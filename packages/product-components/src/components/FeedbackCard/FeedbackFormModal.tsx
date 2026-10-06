import { type ReactNode } from 'react';

import { type Rating } from '@suite-common/feedback';
import { Column, Modal, Paragraph, Textarea } from '@trezor/components';

import { EmojiRatingSelector } from '../EmojiRatingSelector/EmojiRatingSelector';

export type FeedbackFormModalProps = {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    cancelLabel: ReactNode;
    rating: Rating;
    feedbackText: string;
    isSubmitDisabled: boolean;
    onRatingSelect: (rating: Rating) => void;
    onFeedbackTextChange: (feedbackText: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export const FeedbackFormModal = ({
    heading,
    description,
    submitLabel,
    cancelLabel,
    rating,
    feedbackText,
    isSubmitDisabled,
    onRatingSelect,
    onFeedbackTextChange,
    onSubmit,
    onCancel,
}: FeedbackFormModalProps) => (
    <Modal
        heading={heading}
        width={480}
        onCancel={onCancel}
        bottomContent={
            <>
                <Modal.Button isDisabled={isSubmitDisabled} onClick={onSubmit}>
                    {submitLabel}
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                    {cancelLabel}
                </Modal.Button>
            </>
        }
    >
        <Column gap={16}>
            <EmojiRatingSelector value={rating} onChange={onRatingSelect} />

            {description && <Paragraph typographyStyle="body-sm">{description}</Paragraph>}

            <Textarea
                rows={3}
                value={feedbackText}
                onChange={e => onFeedbackTextChange(e.target.value)}
                characterCount
                maxLength={1000}
            />
        </Column>
    </Modal>
);
