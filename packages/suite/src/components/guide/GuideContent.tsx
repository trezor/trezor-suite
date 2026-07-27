import { type ReactNode } from 'react';

import { Box } from '@trezor/components';

type GuideContentProps = {
    children: ReactNode;
};

export const GuideContent = ({ children }: GuideContentProps) => (
    <Box flex="1" padding={{ top: 8, right: 16, left: 16 }}>
        {children}
    </Box>
);
