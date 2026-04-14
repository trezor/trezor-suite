import { HStack, IconButton, Text } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CopyableTextProps = {
    text: string;
    title?: string;
};

const textToCopyStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const CopyableText = ({ text, title }: CopyableTextProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { applyStyle } = useNativeStyles();

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="body-sm">{title}</Text>
            <Text
                variant="body-sm"
                color="contentSecondary"
                numberOfLines={1}
                ellipsizeMode="middle"
                style={applyStyle(textToCopyStyle)}
            >
                {text}
            </Text>
            <IconButton
                iconName="copy"
                intent="neutral"
                priority="secondary"
                accessibilityLabel="Copy to clipboard"
                onPress={() => copyToClipboard(text)}
            />
        </HStack>
    );
};
