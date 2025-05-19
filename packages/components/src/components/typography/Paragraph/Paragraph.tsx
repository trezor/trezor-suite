import React from 'react';

import { Text, TextProps } from '../Text/Text';

export const Paragraph = ({ children, as, role, ...rest }: TextProps) => (
    <Text {...rest} as={as || 'div'} role={role || 'paragraph'}>
        {children}
    </Text>
);
