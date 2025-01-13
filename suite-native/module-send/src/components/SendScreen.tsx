import { ReactNode } from 'react';

import { Screen } from '@suite-native/navigation';

type SendScreenProps = {
    children: ReactNode;
    screenHeader: ReactNode;
    footer?: ReactNode;
};

export const SendScreen = ({ children, footer, screenHeader }: SendScreenProps) => (
    <Screen header={screenHeader} footer={footer} keyboardDismissMode="on-drag">
        {children}
    </Screen>
);
