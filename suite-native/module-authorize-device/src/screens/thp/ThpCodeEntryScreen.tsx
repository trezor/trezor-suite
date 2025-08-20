import React from 'react';

import { Screen } from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { useInitiateThpConnection } from '../../hooks/useInitiateThpConnection';

export const ThpCodeEntryScreen = () => {
    const { initiateThpConnection } = useInitiateThpConnection();

    return (
        <Screen header={<ThpScreenHeader />}>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </Screen>
    );
};
