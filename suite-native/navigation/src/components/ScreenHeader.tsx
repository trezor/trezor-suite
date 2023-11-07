import { ReactNode } from 'react';

import { ScreenHeaderWrapper } from '@suite-native/atoms';

type ScreenHeaderProps = {
    children: ReactNode;
    hasBottomPadding?: boolean;
};

export const ScreenHeader = ({ hasBottomPadding, children }: ScreenHeaderProps) => (
    <ScreenHeaderWrapper marginBottom={hasBottomPadding ? 'small' : undefined}>
        {children}
    </ScreenHeaderWrapper>
);
