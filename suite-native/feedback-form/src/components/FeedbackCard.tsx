import { type ReactNode, useState } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { AnimatedBox, Card, HStack, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';

import { EmojiRatingButton } from './EmojiRatingButton';
import { FeedbackFormSheet } from './FeedbackFormSheet';
import { FeedbackSuccessMessage } from './FeedbackSuccessMessage';

type FeedbackCardView = 'form' | 'success';

export type FeedbackCardProps = {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    closeLabel: ReactNode;
    onSubmit: (rating: Rating, description: string) => void;
    defaultView?: FeedbackCardView;
};

export const FeedbackCard = ({
    heading,
    description,
    submitLabel,
    successHeading,
    successDescription,
    closeLabel,
    onSubmit,
    defaultView = 'form',
}: FeedbackCardProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [feedbackText, setFeedbackText] = useState('');
    const [view, setView] = useState<FeedbackCardView>(defaultView);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal({ isNestedSheet: true });

    const handleSelectRating = (selectedRating: Rating) => {
        setRating(selectedRating);
        openModal();
    };

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleSubmit = () => {
        if (!isFormValid) {
            return;
        }

        onSubmit(rating, feedbackText);
        setView('success');
    };

    const handleDismiss = () => {
        setRating(undefined);
        setFeedbackText('');
    };

    return (
        <Card>
            <AnimatedBox layout={LinearTransition}>
                {view === 'success' ? (
                    <FeedbackSuccessMessage
                        heading={successHeading}
                        description={successDescription}
                    />
                ) : (
                    <VStack spacing="sp16">
                        <Text variant="headline-sm">{heading}</Text>
                        <HStack spacing="sp8" justifyContent="space-between">
                            {ratingOptions.map(({ id, emoji }) => (
                                <EmojiRatingButton
                                    key={id}
                                    rating={id}
                                    emoji={emoji}
                                    onPress={handleSelectRating}
                                />
                            ))}
                        </HStack>
                    </VStack>
                )}
            </AnimatedBox>
            <FeedbackFormSheet
                ref={bottomSheetRef}
                title={heading}
                description={description}
                submitLabel={submitLabel}
                successHeading={successHeading}
                successDescription={successDescription}
                closeLabel={closeLabel}
                isSuccessDisplayed={view === 'success'}
                rating={rating}
                feedbackText={feedbackText}
                onRatingSelect={setRating}
                onFeedbackTextChange={setFeedbackText}
                onSubmit={handleSubmit}
                onClose={closeModal}
                onDismiss={handleDismiss}
            />
        </Card>
    );
};
