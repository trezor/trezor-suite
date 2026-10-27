import { Fragment, useState } from 'react';

import { extractUrlsFromText } from '@trezor/utils';

import { BlurredUrl } from './BlurredUrl';
import { Text, type TextProps } from '../Text';

type BlurUrlsProps = TextProps & {
    text: string;
};

type RevealedUrls = {
    text: string;
    indexes: number[];
};

export const BlurUrls = ({
    text,
    variant = 'body-md',
    color = 'contentPrimary',
    ...textProps
}: BlurUrlsProps) => {
    const [revealedUrls, setRevealedUrls] = useState<RevealedUrls>({ text, indexes: [] });
    const revealedIndexes = revealedUrls.text === text ? revealedUrls.indexes : [];
    const { textParts, urls } = extractUrlsFromText(text);
    const accessibilityLabel = textParts
        .map((part, index) => {
            const url = urls[index];
            if (url === undefined) return part;

            return part + (revealedIndexes.includes(index) ? url : '…');
        })
        .join('');
    const accessibilityActions = urls.map((url, index) => ({
        name: urls.length === 1 ? 'activate' : `toggle-url-${index}`,
        label: url,
    }));

    const toggleReveal = (index: number) => {
        setRevealedUrls(current => {
            const indexes = current.text === text ? current.indexes : [];

            return {
                text,
                indexes: indexes.includes(index)
                    ? indexes.filter(revealedIndex => revealedIndex !== index)
                    : [...indexes, index],
            };
        });
    };

    return (
        <Text
            {...textProps}
            variant={variant}
            color={color}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={urls.length === 1 ? 'button' : undefined}
            accessibilityState={
                urls.length === 1 ? { expanded: revealedIndexes.includes(0) } : undefined
            }
            accessibilityActions={accessibilityActions}
            onAccessibilityAction={event => {
                const index = accessibilityActions.findIndex(
                    action => action.name === event.nativeEvent.actionName,
                );
                if (index !== -1) toggleReveal(index);
            }}
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
                                isRevealed={revealedIndexes.includes(index)}
                                onToggle={() => toggleReveal(index)}
                            />
                        )}
                    </Fragment>
                );
            })}
        </Text>
    );
};
