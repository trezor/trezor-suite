import { ReactNode } from 'react';

import { useNativeStyles } from '@trezor/styles';
import { Screen } from '@suite-native/navigation';

type SendScreenProps = {
    children: ReactNode;
    screenHeader: ReactNode;
    subheader?: ReactNode;
    footer?: ReactNode;
};

export const SendScreen = ({ children, footer, screenHeader, subheader }: SendScreenProps) => {
    const { utils } = useNativeStyles();

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            screenHeader={screenHeader}
            subheader={subheader}
            footer={footer}
            keyboardDismissMode="on-drag"
        >
            {children}
        </Screen>
    );
};
