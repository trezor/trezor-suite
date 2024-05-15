import { ReactNode } from 'react';

import { Screen } from '@suite-native/navigation';
import { useNativeStyles } from '@trezor/styles';

import { PassphraseScreenHeader } from './PassphraseScreenHeader';

type PassphraseScreenWrapperProps = {
    children: ReactNode;
};

export const PassphraseScreenWrapper = ({ children }: PassphraseScreenWrapperProps) => {
    const { utils } = useNativeStyles();

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            screenHeader={<PassphraseScreenHeader />}
        >
            {children}
        </Screen>
    );
};
