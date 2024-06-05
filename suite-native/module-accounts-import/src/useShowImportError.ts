import { useCallback } from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { IconName } from '@suite-common/icons';
import { PictogramVariant } from '@suite-native/atoms';

type AlertError = 'invalidXpub' | 'invalidReceiveAddress' | 'networkError' | 'unknownError';
type AlertErrorOptions = {
    title: string;
    description: string;
    icon: IconName;
};

const alertErrorMap: Record<AlertError, AlertErrorOptions> = {
    invalidXpub: {
        title: 'Invalid Public address (XPUB)',
        description: 'Check and correct the public address (XPUB).',
        icon: 'warningTriangleLight',
    },
    invalidReceiveAddress: {
        title: 'Receive address invalid',
        description: 'Check and correct the receive address.',
        icon: 'warningTriangleLight',
    },
    networkError: {
        title: 'Network error',
        icon: 'noConnection',
        description:
            'We were unable to retrieve the data from the blockchain due to a network error.',
    },
    unknownError: {
        title: 'Something went wrong',
        icon: 'warningTriangleLight',
        description: 'We are unable to gather the data right now. Please try again.',
    },
};

const pictogramVariant: PictogramVariant = 'red';

type NavigationProp = StackToStackCompositeNavigationProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>;

export const useShowImportError = (networkSymbol: NetworkSymbol, navigation: NavigationProp) => {
    const { showAlert } = useAlert();

    const showImportError = useCallback(
        (message?: string, onRetry?: () => void) => {
            let alertError: AlertError = 'unknownError';

            if (message) {
                const lowerCasedMessage = message.toLowerCase();
                const { networkType } = networks[networkSymbol];

                if (lowerCasedMessage.includes('invalid address')) {
                    if (networkType === 'bitcoin' || networkType === 'cardano') {
                        alertError = 'invalidXpub';
                    } else {
                        alertError = 'invalidReceiveAddress';
                    }
                } else if (lowerCasedMessage.includes('network')) {
                    alertError = 'networkError';
                }
            }

            const handleGoBack = () =>
                navigation.navigate(RootStackRoutes.AccountsImport, {
                    screen: AccountsImportStackRoutes.XpubScan,
                    params: {
                        networkSymbol,
                    },
                });

            const { title, description, icon } = alertErrorMap[alertError];

            if (onRetry) {
                showAlert({
                    title,
                    description,
                    icon,
                    pictogramVariant,
                    primaryButtonTitle: 'Try Again',
                    onPressPrimaryButton: onRetry,
                    secondaryButtonTitle: 'Go back',
                    onPressSecondaryButton: handleGoBack,
                });
            } else {
                showAlert({
                    title,
                    description,
                    icon,
                    pictogramVariant,
                    primaryButtonTitle: 'Go back',
                    onPressPrimaryButton: handleGoBack,
                    testID: `@alert-sheet/error/${alertError}`,
                });
            }
        },
        [networkSymbol, showAlert, navigation],
    );

    return showImportError;
};
