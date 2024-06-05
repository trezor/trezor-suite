import { ReactNode } from 'react';

import { TypographyStyle } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Text } from './Text';
import { VStack } from './Stack';

type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
};

const textStyle = prepareNativeStyle<{ textAlign: TitleHeaderProps['textAlign'] }>(
    (_, { textAlign }) => ({
        textAlign,
        width: '100%',
    }),
);

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
    textAlign = 'left',
}: TitleHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack alignItems="center">
            {title && (
                <Text variant={titleVariant} style={applyStyle(textStyle, { textAlign })}>
                    {title}
                </Text>
            )}
            {subtitle && (
                <Text color="textSubdued" style={applyStyle(textStyle, { textAlign })}>
                    {subtitle}
                </Text>
            )}
        </VStack>
    );
};

export const CenteredTitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
}: TitleHeaderProps) => {
    return (
        <TitleHeader
            titleVariant={titleVariant}
            title={title}
            subtitle={subtitle}
            textAlign="center"
        />
    );
};
