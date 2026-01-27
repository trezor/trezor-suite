import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { useInitiateThpConnection } from '../../hooks/useInitiateThpConnection';
import { selectIsThpScreenDismissable } from '../../selectors';

export const ThpCodeEntryScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { initiateThpConnection } = useInitiateThpConnection();

    const isThpScreenDismissable = useSelector(selectIsThpScreenDismissable);

    useFocusEffect(
        useCallback(() => {
            if (isThpScreenDismissable) {
                navigateToInitialScreen();
            }
        }, [isThpScreenDismissable, navigateToInitialScreen]),
    );

    return (
        <Screen header={<ThpScreenHeader />}>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </Screen>
    );
};
