import { useState } from 'react';
import { TextInput } from 'react-native';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const descriptionInputStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    borderRadius: utils.borders.radii.r12,
    backgroundColor: utils.colors.elementFillField,
    padding: utils.spacings.sp16,
    minHeight: 100,
    color: utils.colors.contentPrimary,
    ...utils.typography['body-md'],
    textAlignVertical: 'top',
}));

const emojiButtonStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    flex: 1,
    padding: utils.spacings.sp8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected
        ? utils.colors.elementFillBrandBold
        : utils.colors.elementFillNeutralSoft,
}));

export interface FeedbackFormState {
    rating?: Rating;
    description: string;
    setRating: (rating: Rating) => void;
    setDescription: (description: string) => void;
    isValid: boolean;
}

export const useFeedbackForm = (): FeedbackFormState => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [description, setDescription] = useState('');

    const isValid = !!rating && description.length > 0;

    return {
        rating,
        description,
        setRating,
        setDescription,
        isValid,
    };
};

interface EmojiRatingOptionProps {
    id: Rating;
    emoji: string;
    isSelected: boolean;
    onPress: (id: Rating) => void;
}

const EmojiRatingOption = ({ id, emoji, isSelected, onPress }: EmojiRatingOptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            onPress={() => onPress(id)}
            style={applyStyle(emojiButtonStyle, { isSelected })}
        >
            <Text variant="headline-sm">{emoji}</Text>
        </PressableOpacity>
    );
};

interface FeedbackFormProps {
    rating?: Rating;
    description?: string;
    setRating: (rating: Rating) => void;
    setDescription: (description: string) => void;
}

export const FeedbackForm = ({
    rating,
    description,
    setRating,
    setDescription,
}: FeedbackFormProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card>
            <VStack spacing="sp24">
                <VStack spacing="sp12">
                    <Text variant="headline-sm">
                        <Translation id="feedbackForm.title" />
                    </Text>

                    <HStack spacing="sp8">
                        {ratingOptions.map(({ id, emoji }) => (
                            <EmojiRatingOption
                                key={id}
                                id={id}
                                emoji={emoji}
                                isSelected={rating === id}
                                onPress={setRating}
                            />
                        ))}
                    </HStack>
                </VStack>

                {!!rating && (
                    <VStack spacing="sp12">
                        <Text variant="body-sm">
                            <Translation id="feedbackForm.description" />
                        </Text>

                        <TextInput
                            style={applyStyle(descriptionInputStyle)}
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                            maxLength={1000}
                        />
                    </VStack>
                )}
            </VStack>
        </Card>
    );
};
