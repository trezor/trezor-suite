import React from 'react';

import { Screen } from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { useInitiateThpConnection } from '../../hooks/useInitiateThpConnection';
import { useThpScreenDismissal } from '../../hooks/useThpScreenDismissal';

export const ThpCodeEntryScreen = () => {
    const { initiateThpConnection } = useInitiateThpConnection();

    useThpScreenDismissal();

    return (
        <Screen header={<ThpScreenHeader />}>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </Screen>
    );
};
