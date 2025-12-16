import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectThpStep } from '@suite-common/thp';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { useInitiateThpConnection } from '../../hooks/useInitiateThpConnection';

export const ThpCodeEntryScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { initiateThpConnection } = useInitiateThpConnection();

    const thpStep = useSelector(selectThpStep);

    useEffect(() => {
        // This is an extreme edge case that occurs only if you disable auto-connect and later
        // decide to enable it via device settings with your remembered device disconnected.
        if (thpStep === 'Autoconnect') {
            navigateToInitialScreen();
        }
    }, [thpStep, navigateToInitialScreen]);

    return (
        <Screen header={<ThpScreenHeader />}>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </Screen>
    );
};
