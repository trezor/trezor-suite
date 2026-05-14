import { type ReactNode, useState } from 'react';

import { type Rating } from '@suite-common/feedback';
import { Button, Card, Column, H3, IconCircle, Paragraph, Row, Textarea } from '@trezor/components';

import { EmojiRatingSelector } from '../EmojiRatingSelector/EmojiRatingSelector';

type FeedbackCardView = 'form' | 'success';

export interface FeedbackCardProps {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    onSubmit: (rating: Rating, description: string) => void;
    defaultView?: FeedbackCardView;
}

export const FeedbackCard = ({
    heading,
    description,
    submitLabel,
    successHeading,
    successDescription,
    onSubmit,
    defaultView = 'form',
}: FeedbackCardProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [feedbackText, setFeedbackText] = useState('');
    const [view, setView] = useState<FeedbackCardView>(defaultView);

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleSubmit = () => {
        if (!isFormValid) return;

        onSubmit(rating, feedbackText);
        setView('success');
        setRating(undefined);
        setFeedbackText('');
    };

    if (view === 'success') {
        return (
            <Card>
                <Row gap={20} margin={{ vertical: 8 }}>
                    <IconCircle name="check" size={40} />
                    <Column gap={8}>
                        <H3>{successHeading}</H3>
                        <Paragraph typographyStyle="body-sm">{successDescription}</Paragraph>
                    </Column>
                </Row>
            </Card>
        );
    }

    return (
        <Card>
            <Column gap={16} alignItems="start" margin={{ vertical: 8 }}>
                <H3>{heading}</H3>

                <EmojiRatingSelector value={rating} onChange={setRating} />

                {description && <Paragraph typographyStyle="body-sm">{description}</Paragraph>}

                <Textarea
                    rows={3}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    characterCount
                    maxLength={1000}
                />

                <Button
                    isDisabled={!isFormValid}
                    intent="brand"
                    type="button"
                    onClick={handleSubmit}
                >
                    {submitLabel}
                </Button>
            </Column>
        </Card>
    );
};
