import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { cleanupSendFormThunk } from '@suite-native/send';

import { navigateOutOfSendFlowAction } from '../utils';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

interface UseSendTransactionErrorAlertProps {
    account: Account | null;
    tokenContract?: TokenAddress;
}

export const useSendTransactionErrorAlert = ({
    account,
    tokenContract,
}: UseSendTransactionErrorAlertProps) => {
    const { showAlert } = useAlert();
    const { dispatch } = useServices(selectDispatch);
    const navigation = useNavigation<NavigationProps>();

    const handleRetryAfterExpiry = useCallback(() => {
        if (!account) return;

        const accountKey = account.key;

        dispatch(cleanupSendFormThunk({ accountKey, tokenContract, shouldDeleteDraft: false }));

        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey,
            tokenContract,
        });
    }, [account, tokenContract, dispatch, navigation]);

    const show = useCallback(() => {
        if (!account) return;

        const accountKey = account.key;

        const titleTranslationId =
            account.networkType === 'solana'
                ? 'moduleSend.review.outputs.errorAlert.solana.title'
                : 'moduleSend.review.outputs.errorAlert.generic.title';

        const descriptionTranslationId =
            account.networkType === 'solana'
                ? 'moduleSend.review.outputs.errorAlert.solana.description'
                : 'moduleSend.review.outputs.errorAlert.generic.description';

        showAlert({
            icon: 'warningCircle',
            title: <Translation id={titleTranslationId} />,
            description: <Translation id={descriptionTranslationId} />,
            primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: handleRetryAfterExpiry,
            secondaryButtonTitle: (
                <Translation id="moduleSend.review.outputs.errorAlert.secondaryButtonTitle" />
            ),
            onPressSecondaryButton: () => {
                dispatch(
                    cleanupSendFormThunk({ accountKey, tokenContract, shouldDeleteDraft: true }),
                );
                navigation.dispatch(
                    navigateOutOfSendFlowAction({
                        accountKey,
                        tokenContract,
                    }),
                );
            },
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
        });
    }, [account, tokenContract, dispatch, navigation, showAlert, handleRetryAfterExpiry]);

    return { show };
};
