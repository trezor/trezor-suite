import { Fragment } from 'react';

import { extractUrlsFromText } from '@trezor/utils';

import { BlurText } from '../BlurText/BlurText';
import { Text, type TextProps } from '../Text';

type BlurUrlsProps = TextProps & {
    text: string;
};

export const BlurUrls = ({
    text,
    variant = 'body-md',
    color = 'contentPrimary',
    ...textProps
}: BlurUrlsProps) => {
    const { textParts, urls } = extractUrlsFromText(text);
    const accessibilityLabel = textParts
        .map((part, index) => {
            const url = urls[index];
            if (url === undefined) return part;

            return part + '…';
        })
        .join('');

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
