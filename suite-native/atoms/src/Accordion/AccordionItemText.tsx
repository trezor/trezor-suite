import { type ReactNode } from 'react';

import { Text } from '../Text';

type AccordionItemTextProps = {
    children: ReactNode;
};

export const AccordionItemText = ({ children }: AccordionItemTextProps) => (
    <Text variant="body-sm" color="contentSecondary">
        {children}
    </Text>
);
