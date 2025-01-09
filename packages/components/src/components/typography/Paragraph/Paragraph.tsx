import React from 'react';

import { Text, TextProps } from '../Text/Text';

export const Paragraph = ({ children, ...rest }: TextProps) => (
    <Text {...rest} as="p">
        {children}
    </Text>
);
