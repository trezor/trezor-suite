import { ReactNode } from 'react';

import { ScreenHeaderWrapper } from '@suite-native/atoms';

type ScreenHeaderProps = {
    children: ReactNode;
    hasBottomPadding?: boolean;
};

export const ScreenHeader = ({ hasBottomPadding, children }: ScreenHeaderProps) => (
    <ScreenHeaderWrapper marginBottom={hasBottomPadding ? 'sp8' : undefined}>
        {children}
    </ScreenHeaderWrapper>
);
