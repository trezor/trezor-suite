import { useCallback } from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeNavigationProp,
} from '@suite-native/navigation';

type AlertError = 'invalidXpub' | 'invalidReceiveAddress' | 'networkError' | 'unknownError';
type AlertErrorOptions = { title: string; description: string; isRetryEnabled: boolean };

const alertErrorMap: Record<AlertError, AlertErrorOptions> = {
    invalidXpub: {
        title: 'Invalid Public address (XPUB)',
        description: 'Check and correct the public address (XPUB).',
        isRetryEnabled: false,
    },
    invalidReceiveAddress: {
        title: 'Receive address invalid',
        description: 'Check and correct the receive address.',
        isRetryEnabled: false,
    },
    networkError: {
        title: 'Network error',
        description:
            'We were unable to retrieve the data from the blockchain due to a network error.',
        isRetryEnabled: true,
    },
    unknownError: {
        title: 'Something went wrong',
        description: 'We are unable to gather the data right now. Please try again.',
        isRetryEnabled: true,
    },
};

export const useShowImportError = (
    networkSymbol: NetworkSymbol,
    navigation: StackToTabCompositeNavigationProp<
        AccountsImportStackParamList,
        AccountsImportStackRoutes.AccountImportLoading,
        RootStackParamList
    >,
) => {
    const { showAlert } = useAlert();

    const showImportError = useCallback(
        (message: string, onRetry: () => Promise<void>) => {
            let alertError: AlertError = 'unknownError';
            const lowerCasedMessage = message.toLowerCase();
            const { networkType } = networks[networkSymbol];

            const handleGoBack = () =>
                navigation.navigate(RootStackRoutes.AccountsImport, {
                    screen: AccountsImportStackRoutes.XpubScan,
                    params: {
                        networkSymbol,
                    },
                });

            if (lowerCasedMessage.includes('invalid address')) {
                if (networkType === 'bitcoin' || networkType === 'cardano') {
                    alertError = 'invalidXpub';
                } else {
                    alertError = 'invalidReceiveAddress';
                }
            } else if (lowerCasedMessage.includes('network')) {
                alertError = 'networkError';
            }

            const { title, description, isRetryEnabled } = alertErrorMap[alertError];

            if (isRetryEnabled) {
                showAlert({
                    title,
                    description,
                    primaryButtonTitle: 'Try Again',
                    onPressPrimaryButton: onRetry,
                    secondaryButtonTitle: 'Go back',
                    onPressSecondaryButton: handleGoBack,
                });
            } else {
                showAlert({
                    title,
                    description,
                    primaryButtonTitle: 'Go back',
                    onPressPrimaryButton: handleGoBack,
                });
            }
        },
        [networkSymbol, showAlert, navigation],
    );

    return showImportError;
};
