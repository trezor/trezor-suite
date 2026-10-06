import { type ReactNode } from 'react';
import { type ImageSourcePropType, TouchableOpacity } from 'react-native';

import { Card, HStack, Image, Text, TextButton, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const IMAGE_SIZE = 80;

const imageStyle = prepareNativeStyle(utils => ({
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: utils.borders.radii.r12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
}));

// IconButton can not be used here because of the glitch in the dark mode implementation. Might be revisited in the followup.
const CloseButton = ({ onPress, testID }: { onPress?: () => void; testID?: string }) => (
    <TouchableOpacity onPress={onPress} hitSlop={8} testID={testID}>
        <Icon name="x" size="medium" color="contentNeutral" />
    </TouchableOpacity>
);

const cardBackgroundStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp4,
    paddingRight: utils.spacings.sp16,
    borderWidth: utils.borders.widths.small,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderColor: utils.colors.surfaceBorderRaised,
}));

export type BannerProps = {
    title: ReactNode;
    ctaText: ReactNode;
    imageSource: ImageSourcePropType;
    onPress: () => void;
    ctaIcon?: IconName;
    onClose?: () => void;
    testID?: string;
};

export const Banner = ({
    title,
    ctaText,
    ctaIcon,
    imageSource,
    onPress,
    onClose,
    testID,
}: BannerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardBackgroundStyle)}>
            <HStack spacing="sp12" alignItems="center" justifyContent="space-between">
                <Image source={imageSource} contentFit="contain" style={applyStyle(imageStyle)} />
                <VStack flex={1} spacing={0}>
                    <Text variant="body-md-strong" color="contentPrimary">
                        {title}
                    </Text>
                    <HStack>
                        <TextButton
                            size="large"
                            intent="neutral"
                            priority="secondary"
                            iconRight={ctaIcon}
                            isUnderlined
                            onPress={onPress}
                            testID={testID && `${testID}/link`}
                        >
                            {ctaText}
                        </TextButton>
                    </HStack>
                </VStack>
                <CloseButton onPress={onClose} testID={testID && `${testID}/close`} />
            </HStack>
        </Card>
    );
};
