import { ReactNode } from 'react';

import { ScreenHeaderWrapper } from '@suite-native/atoms';

type ScreenHeaderProps = {
    children: ReactNode;
};

export const ScreenHeader = ({ children }: ScreenHeaderProps) => (
    <ScreenHeaderWrapper marginBottom="sp8">{children}</ScreenHeaderWrapper>
);
