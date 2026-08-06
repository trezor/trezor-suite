import { type ReactNode, type Ref, useRef } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import {
    BottomSheetModal,
    Box,
    Button,
    HStack,
    Input,
    type InputType,
    Text,
    VStack,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EmojiRatingButton } from './EmojiRatingButton';
import { FeedbackSuccessMessage } from './FeedbackSuccessMessage';

export const MAX_DESCRIPTION_LENGTH = 1000;

type FeedbackFormSheetProps = {
    ref: Ref<BottomSheetModalMethods>;
    title: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    successHeading: ReactNode;
    successDescription: ReactNode;
    closeLabel: ReactNode;
    isSuccessDisplayed: boolean;
    rating?: Rating;
    feedbackText: string;
    onRatingSelect: (rating: Rating) => void;
    onFeedbackTextChange: (feedbackText: string) => void;
    onSubmit: () => void;
    onClose: () => void;
    onDismiss: () => void;
};

const descriptionInputStyle = prepareNativeStyle(() => ({
    minHeight: 80,
}));

export const FeedbackFormSheet = ({
    ref,
    title,
    description,
    submitLabel,
    successHeading,
    successDescription,
    closeLabel,
    isSuccessDisplayed,
    rating,
    feedbackText,
    onRatingSelect,
    onFeedbackTextChange,
    onSubmit,
    onClose,
    onDismiss,
}: FeedbackFormSheetProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const inputRef = useRef<InputType | null>(null);

    const isFormValid = rating !== undefined && feedbackText.trim().length > 0;

    const handleSheetChange = (index: number) => {
        if (index >= 0 && !isSuccessDisplayed) {
            inputRef.current?.focus();
        }
    };

    return (
        <BottomSheetModal
            ref={ref}
            title={title}
            isCloseDisplayed
            onDismiss={onDismiss}
            bottomSheetCustomProps={{ onChange: handleSheetChange }}
        >
            {isSuccessDisplayed ? (
                <VStack spacing="sp16">
                    <FeedbackSuccessMessage
                        heading={successHeading}
                        description={successDescription}
                    />
                    <Button onPress={onClose} testID="@feedback-form/close-button">
                        {closeLabel}
                    </Button>
                </VStack>
            ) : (
                <VStack spacing="sp16">
                    <HStack spacing="sp8" justifyContent="space-between">
                        {ratingOptions.map(({ id, emoji }) => (
                            <EmojiRatingButton
                                key={id}
                                rating={id}
                                emoji={emoji}
                                isSelected={rating === id}
                                onPress={onRatingSelect}
                                testID={`@feedback-form/sheet/rating/${id}`}
                            />
                        ))}
                    </HStack>
                    {!!description && (
                        <Text variant="body-sm" color="contentSecondary">
                            {description}
                        </Text>
                    )}
                    <VStack spacing="sp4">
                        <Input
                            ref={inputRef}
                            style={applyStyle(descriptionInputStyle)}
                            placeholderTextColor={utils.colors.contentSecondary}
                            asBottomSheetInput
                            multiline
                            numberOfLines={3}
                            value={feedbackText}
                            onChangeText={onFeedbackTextChange}
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
                        onPress={onSubmit}
                        testID="@feedback-form/submit-button"
                    >
                        {submitLabel}
                    </Button>
                </VStack>
            )}
        </BottomSheetModal>
    );
};
