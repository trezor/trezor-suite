import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type ReviewFormType = 'stake' | 'claim';

type NavigationProps = StackToStackCompositeNavigationProps<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

type AlertKeys = {
    title: TxKeyPath;
    description: TxKeyPath;
    primaryButton: TxKeyPath;
};

type AlertTranslationKeys = {
    pushFailed: AlertKeys;
    pendingConflict: AlertKeys;
};

const translationKeys = {
    stake: {
        pushFailed: {
            title: 'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.description',
            primaryButton:
                'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton',
        },
        pendingConflict: {
            title: 'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
            primaryButton:
                'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton',
        },
    },
    claim: {
        pushFailed: {
            title: 'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.description',
            primaryButton:
                'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton',
        },
        pendingConflict: {
            title: 'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
            primaryButton:
                'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton',
        },
    },
} as const satisfies Record<ReviewFormType, AlertTranslationKeys>;

export const useShowPushTransactionFailedDuringReviewAlert = (formType: ReviewFormType) => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();
    const keys = translationKeys[formType];

    const handleGoHome = useCallback(() => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
    }, [navigation]);

    const showPushTransactionFailedAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id={keys.pushFailed.title} />,
                description: <Translation id={keys.pushFailed.description} />,
                primaryButtonTitle: <Translation id={keys.pushFailed.primaryButton} />,
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, keys, showAlert],
    );

    const showPendingTransactionConflictAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id={keys.pendingConflict.title} />,
                description: <Translation id={keys.pendingConflict.description} />,
                primaryButtonTitle: <Translation id={keys.pendingConflict.primaryButton} />,
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, keys, showAlert],
    );

    return { showPushTransactionFailedAlert, showPendingTransactionConflictAlert };
};
