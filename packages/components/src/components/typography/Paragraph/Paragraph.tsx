import React from 'react';

import type { TextProps } from '../Text/Text';
import { Text } from '../Text/Text';

export const Paragraph = ({ children, as, role, ...rest }: TextProps) => (
    <Text {...rest} as={as || 'div'} role={role || 'paragraph'}>
        {children}
    </Text>
);
