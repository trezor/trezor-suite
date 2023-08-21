import React from 'react';

import { TypographyStyle } from '@trezor/theme';

import { Text } from './Text';

type TrezorSuiteLiteHeaderProps = {
    textVariant?: TypographyStyle;
};

export const TrezorSuiteLiteHeader = ({
    textVariant = 'titleSmall',
}: TrezorSuiteLiteHeaderProps) => (
    <Text variant={textVariant} color="textSecondaryHighlight">
        Trezor Suite{' '}
        <Text variant={textVariant} color="textSubdued">
            Lite
        </Text>
    </Text>
);
