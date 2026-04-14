import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-native/analytics';
import { Spinner, type SpinnerLoadingState, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { PassphraseScreenHeader, selectPassphraseDeviceNotEmpty } from '@suite-native/passphrase';
import { useAnalytics } from '@suite-native/services';

export const PassphraseLoadingScreen = () => {
    const isDeviceNotEmpty = useSelector(selectPassphraseDeviceNotEmpty);
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const analytics = useAnalytics();
    const [loadingResult, setLoadingResult] = useState<SpinnerLoadingState>('idle');

    useEffect(() => {
        if (isDeviceNotEmpty !== null) {
            setLoadingResult('success');
        }
    }, [isDeviceNotEmpty]);

    const handleSuccess = () => {
        if (isDeviceNotEmpty) {
            analytics.report({
                type: events.passphraseFlowFinishedEvent.name,
                payload: { isEmptyWallet: false },
            });
            navigateToInitialScreen();
        }
    };

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp32">
                <Spinner loadingState={loadingResult} onComplete={handleSuccess} />
                <VStack spacing="sp4">
                    <Text variant="headline-sm" textAlign="center">
                        <Translation id="modulePassphrase.loading.title" />
                    </Text>
                    <Text variant="body-md" textAlign="center" color="contentSecondary">
                        <Translation id="modulePassphrase.loading.subtitle" />
                    </Text>
                </VStack>
            </VStack>
        </Screen>
    );
};
