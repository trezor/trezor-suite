import { type ReactNode } from 'react';

import { Box } from '@trezor/components';

type GuideContentProps = {
    children: ReactNode;
};

export const GuideContent = ({ children }: GuideContentProps) => (
    <Box flex="1" padding={{ top: 16, right: 20, left: 20 }}>
        {children}
    </Box>
);
