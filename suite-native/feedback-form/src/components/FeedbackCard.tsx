import { type ReactNode, useRef, useState } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import {
    AnimatedBox,
    Box,
    Card,
    HStack,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import type { NativeTypographyStyle } from '@trezor/theme';

import { EmojiRatingButton } from './EmojiRatingButton';
import { FeedbackCardDismissButton } from './FeedbackCardDismissButton';
import { FeedbackFormSheet } from './FeedbackFormSheet';
import { FeedbackSuccessMessage } from './FeedbackSuccessMessage';

type FeedbackCardView = 'form' | 'success';
type SubmissionState = 'idle' | 'sending' | 'failed';

const ratingRowStyle = prepareNativeStyle(() => ({
    width: '100%',
    maxWidth: 360,
}));

export type FeedbackCardProps = {
    heading: ReactNode;
    headingVariant?: NativeTypographyStyle;
    description?: ReactNode;
    submitLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    closeLabel: ReactNode;
    onSubmit: (rating: Rating, description: string) => void | Promise<void>;
    onRatingSelect?: (rating: Rating) => void;
    defaultView?: FeedbackCardView;
    onDismiss?: () => void;
};

export const FeedbackCard = ({
    heading,
    headingVariant = 'headline-sm',
    description,
    submitLabel,
    successHeading,
    successDescription,
    closeLabel,
    onSubmit,
    onRatingSelect,
    defaultView = 'form',
    onDismiss,
}: FeedbackCardProps) => {
    const { applyStyle } = useNativeStyles();
    const [rating, setRating] = useState<Rating | undefined>();
    const [feedbackText, setFeedbackText] = useState('');
    const [view, setView] = useState<FeedbackCardView>(defaultView);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
    const submissionPending = useRef(false);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal({ isNestedSheet: true });

    const selectRating = (selectedRating: Rating) => {
        if (submissionPending.current) return;

        setRating(selectedRating);
        onRatingSelect?.(selectedRating);
    };

    const handleCardRatingPress = (selectedRating: Rating) => {
        selectRating(selectedRating);
        openModal();
    };

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleSubmit = async () => {
        if (!isFormValid || submissionPending.current) return;

        submissionPending.current = true;
        setSubmissionState('sending');

        try {
            const submission = onSubmit(rating, feedbackText);
            if (submission) await submission;
            setView('success');
            setRating(undefined);
            setFeedbackText('');
            setSubmissionState('idle');
        } catch {
            setSubmissionState('failed');
        } finally {
            submissionPending.current = false;
        }
    };

    const handleSheetDismiss = () => {
        if (submissionPending.current || submissionState === 'failed') return;

        setRating(undefined);
        setFeedbackText('');
        setSubmissionState('idle');
    };

    const dismissButton = onDismiss && <FeedbackCardDismissButton onPress={onDismiss} />;

    return (
        <Card>
            <AnimatedBox layout={LinearTransition}>
                {view === 'success' ? (
                    <HStack spacing="sp12" alignItems="flex-start">
                        <Box flex={1}>
                            <FeedbackSuccessMessage
                                heading={successHeading}
                                description={successDescription}
                            />
                        </Box>
                        {dismissButton}
                    </HStack>
                ) : (
                    <VStack spacing="sp16">
                        <HStack spacing="sp12" alignItems="flex-start">
                            <Box flex={1}>
                                <Text variant={headingVariant}>{heading}</Text>
                            </Box>
                            {dismissButton}
                        </HStack>
                        <HStack
                            spacing="sp8"
                            justifyContent="space-between"
                            style={applyStyle(ratingRowStyle)}
                        >
                            {ratingOptions.map(({ id, emoji }) => (
                                <EmojiRatingButton
                                    key={id}
                                    rating={id}
                                    emoji={emoji}
                                    onPress={handleCardRatingPress}
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
                isSubmitting={submissionState === 'sending'}
                hasSubmissionError={submissionState === 'failed'}
                rating={rating}
                feedbackText={feedbackText}
                onRatingSelect={selectRating}
                onFeedbackTextChange={setFeedbackText}
                onSubmit={() => void handleSubmit()}
                onClose={closeModal}
                onDismiss={handleSheetDismiss}
            />
        </Card>
    );
};
