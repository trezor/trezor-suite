import { useState } from 'react';
import { Pressable } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

const MAX_COLLAPSED_LENGTH = 300;

type ReviewOutputHexDataProps = {
    value: string;
};

export const ReviewOutputHexData = ({ value }: ReviewOutputHexDataProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const copyToClipboard = useCopyToClipboard();

    if (!value) {
        return (
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="transactionManagement.review.outputs.transactionDataEmpty" />
            </Text>
        );
    }

    const isTruncatable = value.length > MAX_COLLAPSED_LENGTH;
    const displayed = !isTruncatable || isExpanded ? value : value.slice(0, MAX_COLLAPSED_LENGTH);

    const handlePress = () => {
        if (isTruncatable) {
            setIsExpanded(prev => !prev);
        }
    };

    const handleLongPress = () => {
        copyToClipboard(value);
    };

    return (
        <VStack spacing="sp8">
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                accessibilityRole="button"
            >
                <Text variant="body-sm">{displayed}</Text>
            </Pressable>
            {isTruncatable && (
                <Pressable onPress={handlePress} accessibilityRole="button">
                    <Text variant="body-xs" color="contentSecondary">
                        <Translation
                            id={
                                isExpanded
                                    ? 'transactionManagement.review.outputs.transactionDataShowLess'
                                    : 'transactionManagement.review.outputs.transactionDataShowMore'
                            }
                        />
                    </Text>
                </Pressable>
            )}
        </VStack>
    );
};
