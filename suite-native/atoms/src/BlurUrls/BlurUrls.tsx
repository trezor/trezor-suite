import { Fragment } from 'react';

import { extractUrlsFromText } from '@trezor/utils';

import { BlurredUrl } from './BlurredUrl';
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
        .map((part, index) => `${part}${index < urls.length ? '…' : ''}`)
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
                            <BlurredUrl text={url} variant={variant} color={color} />
                        )}
                    </Fragment>
                );
            })}
        </Text>
    );
};
