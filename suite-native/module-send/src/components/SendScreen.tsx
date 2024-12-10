import { ReactNode } from 'react';

import { Screen } from '@suite-native/navigation';

type SendScreenProps = {
    children: ReactNode;
    screenHeader: ReactNode;
    subheader?: ReactNode;
    footer?: ReactNode;
};

export const SendScreen = ({ children, footer, screenHeader, subheader }: SendScreenProps) => {
    return (
        <Screen
            screenHeader={screenHeader}
            subheader={subheader}
            footer={footer}
            keyboardDismissMode="on-drag"
        >
            {children}
        </Screen>
    );
};
