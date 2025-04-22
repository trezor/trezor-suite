import React from 'react';

import { Without } from '@trezor/type-utils';

import { Text, TextProps } from '../Text/Text';

export const Paragraph = ({ children, ...rest }: Without<TextProps, 'as'>) => (
    <Text {...rest} as="p">
        {children}
    </Text>
);
