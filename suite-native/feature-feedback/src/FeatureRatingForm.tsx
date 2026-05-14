import { useState } from 'react';
import { TextInput } from 'react-native';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EmojiRatingOption } from './EmojiRatingOption';

type FeatureRatingFormProps = {
    titleKey: TxKeyPath;
    onSubmit: (rating: Rating, description: string) => void;
    onDismiss: () => void;
};

const descriptionInputStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    borderRadius: utils.borders.radii.r12,
    backgroundColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation0,
    padding: utils.spacings.sp16,
    minHeight: 100,
    color: utils.colors.contentPrimary,
    ...utils.typography['body-md'],
    textAlignVertical: 'top',
}));

export const FeatureRatingForm = ({ titleKey, onSubmit, onDismiss }: FeatureRatingFormProps) => {
    const { applyStyle } = useNativeStyles();
    const [rating, setRating] = useState<Rating | undefined>();
    const [description, setDescription] = useState('');

    const isFormValid = rating !== undefined && description.trim().length > 0;

    const handleSubmit = () => {
        if (!isFormValid) return;
        onSubmit(rating, description);
        onDismiss();
    };

    return (
        <Card>
            <VStack spacing="sp24">
                <VStack spacing="sp12">
                    <Text variant="body-sm">
                        <Translation
                            id="moduleSettings.advanced.featureFeedback.ratingLabel"
                            values={{ featureName: <Translation id={titleKey} /> }}
                        />
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
                <VStack spacing="sp12">
                    <Text variant="body-sm">
                        <Translation id="moduleSettings.advanced.featureFeedback.descriptionLabel" />
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
                {isFormValid && (
                    <Button onPress={handleSubmit}>
                        <Translation id="moduleSettings.advanced.featureFeedback.submitButton" />
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
