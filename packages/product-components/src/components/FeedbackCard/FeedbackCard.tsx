import { type ReactNode, useState } from 'react';

import { type Rating } from '@suite-common/feedback';
import { Card, Column, Flex, H3, IconCircle, Paragraph, Row } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { FeedbackFormModal } from './FeedbackFormModal';
import { EmojiRatingSelector } from '../EmojiRatingSelector/EmojiRatingSelector';

type FeedbackCardView = 'form' | 'success';

export type FeedbackCardProps = {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    cancelLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    onSubmit: (rating: Rating, description: string) => void;
    onRatingSelect?: (rating: Rating) => void;
    defaultView?: FeedbackCardView;
    /** Puts the ratings under the heading instead of across the card from it. */
    isStacked?: boolean;
};

export const FeedbackCard = ({
    heading,
    description,
    submitLabel,
    cancelLabel,
    successHeading,
    successDescription,
    onSubmit,
    onRatingSelect,
    defaultView = 'form',
    isStacked = false,
}: FeedbackCardProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [feedbackText, setFeedbackText] = useState('');
    const [view, setView] = useState<FeedbackCardView>(defaultView);

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleRatingSelect = (selectedRating: Rating) => {
        setRating(selectedRating);
        onRatingSelect?.(selectedRating);
    };

    const handleCancel = () => {
        setRating(undefined);
        setFeedbackText('');
    };

    const handleSubmit = () => {
        if (!isFormValid) {
            return;
        }

        onSubmit(rating, feedbackText);
        setView('success');
        setRating(undefined);
        setFeedbackText('');
    };

    if (view === 'success') {
        return (
            <Card>
                <Row gap={20} margin={{ vertical: 8 }}>
                    <IconCircle icon={CheckIcon} size={40} />
                    <Column gap={8}>
                        <H3>{successHeading}</H3>
                        <Paragraph typographyStyle="body-sm">{successDescription}</Paragraph>
                    </Column>
                </Row>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Flex
                    direction={isStacked ? 'column' : 'row'}
                    gap={16}
                    justifyContent={isStacked ? 'flex-start' : 'space-between'}
                    alignItems={isStacked ? 'flex-start' : 'center'}
                    flexWrap="wrap"
                >
                    <H3 typographyStyle="body-md-strong">{heading}</H3>

                    <EmojiRatingSelector value={rating} onChange={handleRatingSelect} />
                </Flex>
            </Card>

            {rating !== undefined && (
                <FeedbackFormModal
                    heading={heading}
                    description={description}
                    submitLabel={submitLabel}
                    cancelLabel={cancelLabel}
                    rating={rating}
                    feedbackText={feedbackText}
                    isSubmitDisabled={!isFormValid}
                    onRatingSelect={handleRatingSelect}
                    onFeedbackTextChange={setFeedbackText}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            )}
        </>
    );
};
