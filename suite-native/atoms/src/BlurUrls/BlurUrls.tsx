import { Fragment } from 'react';

import { useNativeStyles } from '@trezor/styles-native';
import { extractUrlsFromText } from '@trezor/utils';

import { Blur } from '../Blur/Blur';
import { BlurText } from '../BlurText/BlurText';
import { Text, type TextProps } from '../Text';

type BlurUrlsProps = TextProps & {
    text: string;
    /** Required when nested inside Text to preserve inline layout. */
    isInline?: boolean;
};

export const BlurUrls = ({
    text,
    isInline = false,
    variant = 'body-md',
    color = 'contentPrimary',
    ...textProps
}: BlurUrlsProps) => {
    const {
        utils: { typography },
    } = useNativeStyles();
    const { textParts, urls } = extractUrlsFromText(text);
    const accessibilityLabel = textParts
        .map((part, index) => {
            const url = urls[index];
            if (url === undefined) return part;

            return part + '…';
        })
        .join('');

    // A standalone URL can use view blur with room for its halo. Mixed text still needs
    // inline spans so ordinary words stay readable and wrapping follows the text layout.
    if (
        !isInline &&
        urls.length === 1 &&
        textParts.every(part => /^\s*(?:\.{3}|…)?\s*$/.test(part))
    ) {
        return (
            <Blur
                blurIntensity={(textProps.style?.fontSize ?? typography[variant].fontSize) * 0.35}
                flexShrink={1}
                accessible
                accessibilityLabel={accessibilityLabel}
            >
                <Text {...textProps} variant={variant} color={color}>
                    {text}
                </Text>
            </Blur>
        );
    }

    return (
        <Text
            {...textProps}
            variant={variant}
            color={color}
            accessibilityLabel={accessibilityLabel}
        >
            {textParts.map((part, index) => {
                const url = urls[index];

                return (
                    <Fragment key={index}>
                        {part}
                        {url !== undefined && (
                            <BlurText variant={variant} color={color}>
                                {url}
                            </BlurText>
                        )}
                    </Fragment>
                );
            })}
        </Text>
    );
};
