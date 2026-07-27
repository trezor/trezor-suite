import { type ReactNode, useState } from 'react';
import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import {
    AnimatedBox,
    Box,
    Button,
    Card,
    HStack,
    Input,
    RoundedIcon,
    Text,
    VStack,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EmojiRatingButton } from './EmojiRatingButton';

const MAX_DESCRIPTION_LENGTH = 1000;

type FeedbackCardView = 'form' | 'success';

export type FeedbackCardProps = {
    heading: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    onSubmit: (rating: Rating, description: string) => void;
    defaultView?: FeedbackCardView;
};

const descriptionInputStyle = prepareNativeStyle(() => ({
    minHeight: 80,
}));

export const FeedbackCard = ({
    heading,
    description,
    submitLabel,
    successHeading,
    successDescription,
    onSubmit,
    defaultView = 'form',
}: FeedbackCardProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const [rating, setRating] = useState<Rating | undefined>();
    const [feedbackText, setFeedbackText] = useState('');
    const [view, setView] = useState<FeedbackCardView>(defaultView);

    const isRatingSelected = rating !== undefined;
    const isFormValid = isRatingSelected && feedbackText.trim().length > 0;

    const handleSubmit = () => {
        if (!isFormValid) {
            return;
        }

        onSubmit(rating, feedbackText);
        setView('success');
        setRating(undefined);
        setFeedbackText('');
    };

    return (
        <Card>
            {/* Animate the card's height linearly whenever its content changes
                (rating rows appearing, or the switch to the success view). */}
            <AnimatedBox layout={LinearTransition}>
                {view === 'success' ? (
                    <HStack spacing="sp20" alignItems="center">
                        <RoundedIcon name="check" intent="brand" size={40} />
                        <VStack spacing="sp8" flex={1}>
                            <Text variant="headline-sm">{successHeading}</Text>
                            <Text variant="body-sm" color="contentSecondary">
                                {successDescription}
                            </Text>
                        </VStack>
                    </HStack>
                ) : (
                    <VStack spacing="sp16">
                        <Text variant="headline-sm">{heading}</Text>
                        <HStack spacing="sp8" justifyContent="space-between">
                            {ratingOptions.map(({ id, emoji }) => (
                                <EmojiRatingButton
                                    key={id}
                                    rating={id}
                                    emoji={emoji}
                                    isSelected={rating === id}
                                    onPress={setRating}
                                />
                            ))}
                        </HStack>
                        {isRatingSelected && (
                            <AnimatedBox
                                entering={FadeIn}
                                exiting={FadeOut}
                                layout={LinearTransition}
                            >
                                <VStack spacing="sp16">
                                    {!!description && (
                                        <Text variant="body-sm" color="contentSecondary">
                                            {description}
                                        </Text>
                                    )}
                                    <VStack spacing="sp4">
                                        <Input
                                            style={applyStyle(descriptionInputStyle)}
                                            placeholderTextColor={utils.colors.contentSecondary}
                                            multiline
                                            numberOfLines={3}
                                            value={feedbackText}
                                            onChangeText={setFeedbackText}
                                            maxLength={MAX_DESCRIPTION_LENGTH}
                                            testID="@feedback-form/description-input"
                                        />
                                        <Box alignItems="flex-end">
                                            <Text variant="body-xs" color="contentSecondary">
                                                {feedbackText.length}/{MAX_DESCRIPTION_LENGTH}
                                            </Text>
                                        </Box>
                                    </VStack>
                                    <Button
                                        isDisabled={!isFormValid}
                                        onPress={handleSubmit}
                                        testID="@feedback-form/submit-button"
                                    >
                                        {submitLabel}
                                    </Button>
                                </VStack>
                            </AnimatedBox>
                        )}
                    </VStack>
                )}
            </AnimatedBox>
        </Card>
    );
};
