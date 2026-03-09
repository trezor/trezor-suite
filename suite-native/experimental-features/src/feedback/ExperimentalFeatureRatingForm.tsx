import { useState } from 'react';
import { TextInput } from 'react-native';

import { Rating, ratingOptions } from '@suite-common/feedback';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ExperimentalFeature } from '@suite-native/settings';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EXPERIMENTAL_FEATURES } from '../experimentalFeatures';
import { EmojiRatingOption } from './EmojiRatingOption';

type ExperimentalFeatureRatingFormProps = {
    feature: ExperimentalFeature;
    onSubmit: (rating: Rating, description: string) => void;
    onDismiss: () => void;
};

const descriptionInputStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    borderRadius: utils.borders.radii.r12,
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
    padding: utils.spacings.sp16,
    minHeight: 100,
    color: utils.colors.textDefault,
    ...utils.typography['body-md'],
    textAlignVertical: 'top',
}));

export const ExperimentalFeatureRatingForm = ({
    feature,
    onSubmit,
    onDismiss,
}: ExperimentalFeatureRatingFormProps) => {
    const { applyStyle } = useNativeStyles();
    const { titleKey } = EXPERIMENTAL_FEATURES[feature];
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
                            id="moduleSettings.advanced.experimentalFeatures.feedback.ratingLabel"
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
                        <Translation id="moduleSettings.advanced.experimentalFeatures.feedback.descriptionLabel" />
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
                    <Button onPress={handleSubmit} size="large">
                        <Translation id="moduleSettings.advanced.experimentalFeatures.feedback.submitButton" />
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
