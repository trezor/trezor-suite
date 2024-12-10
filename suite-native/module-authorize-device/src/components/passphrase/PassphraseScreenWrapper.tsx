import { ReactNode } from 'react';

import { Screen } from '@suite-native/navigation';

import { PassphraseScreenHeader } from './PassphraseScreenHeader';

type PassphraseScreenWrapperProps = {
    children: ReactNode;
};

export const PassphraseScreenWrapper = ({ children }: PassphraseScreenWrapperProps) => (
    <Screen screenHeader={<PassphraseScreenHeader />}>{children}</Screen>
);
