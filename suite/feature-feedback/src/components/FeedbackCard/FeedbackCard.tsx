import { type ReactNode, useRef, useState } from 'react';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Card, Column, Flex, H3, IconCircle, Paragraph, Row } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';
import { EmojiRatingSelector } from '@trezor/product-components';

import { FeedbackFormModal } from './FeedbackFormModal';

type FeedbackCardView = 'form' | 'success';
type SubmissionState = 'idle' | 'sending' | 'failed';

export type FeedbackCardProps = {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    cancelLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    onSubmit: (rating: Rating, description: string) => void | Promise<void>;
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
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
    const submissionPending = useRef(false);

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleRatingSelect = (selectedRating: Rating) => {
        if (submissionPending.current) return;

        setRating(selectedRating);
        onRatingSelect?.(selectedRating);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        if (submissionPending.current || submissionState !== 'idle') return;

        setRating(undefined);
        setFeedbackText('');
    };

    const handleSubmit = async () => {
        if (!isFormValid || submissionPending.current) return;

        submissionPending.current = true;
        setSubmissionState('sending');

        try {
            const submission = onSubmit(rating, feedbackText);
            if (submission) await submission;
            setView('success');
            setIsFormOpen(false);
            setRating(undefined);
            setFeedbackText('');
            setSubmissionState('idle');
        } catch {
            setSubmissionState('failed');
        } finally {
            submissionPending.current = false;
        }
    };

    if (view === 'success') {
        return (
            <Card>
                <Row gap={20} margin={{ vertical: 8 }}>
                    <IconCircle icon={CheckIcon} size={40} />
                    <Column gap={8}>
                        <H3 data-testid="@feedback/card/success-heading">{successHeading}</H3>
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

                    <EmojiRatingSelector
                        options={ratingOptions}
                        value={rating}
                        onChange={selectedRating => {
                            handleRatingSelect(selectedRating);
                            setIsFormOpen(true);
                        }}
                        data-testid="@feedback/card/rating"
                    />
                </Flex>
            </Card>

            {isFormOpen && rating !== undefined && (
                <FeedbackFormModal
                    heading={heading}
                    description={description}
                    submitLabel={submitLabel}
                    cancelLabel={cancelLabel}
                    rating={rating}
                    feedbackText={feedbackText}
                    isSubmitDisabled={!isFormValid}
                    isSubmitting={submissionState === 'sending'}
                    onRatingSelect={handleRatingSelect}
                    onFeedbackTextChange={setFeedbackText}
                    onSubmit={() => void handleSubmit()}
                    onCancel={handleCancel}
                />
            )}
        </>
    );
};
