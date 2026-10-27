import { Fragment, useState } from 'react';

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
    const [revealedText, setRevealedText] = useState<string | null>(null);
    const isRevealed = revealedText === text;
    const { textParts, urls } = extractUrlsFromText(text);
    const hasUrls = urls.length > 0;
    const accessibilityLabel = isRevealed
        ? text
        : textParts.map((part, index) => `${part}${index < urls.length ? '…' : ''}`).join('');

    const toggleReveal = () => setRevealedText(isRevealed ? null : text);

    return (
        <Text
            {...textProps}
            variant={variant}
            color={color}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={hasUrls ? 'button' : undefined}
            accessibilityState={hasUrls ? { expanded: isRevealed } : undefined}
            accessibilityActions={hasUrls ? [{ name: 'activate' }] : undefined}
            onAccessibilityAction={hasUrls ? toggleReveal : undefined}
        >
            {textParts.map((part, index) => {
                const url = urls[index];

                return (
                    <Fragment key={index}>
                        {part}
                        {url !== undefined && (
                            <BlurredUrl
                                text={url}
                                variant={variant}
                                color={color}
                                isRevealed={isRevealed}
                                onToggle={toggleReveal}
                            />
                        )}
                    </Fragment>
                );
            })}
        </Text>
    );
};
