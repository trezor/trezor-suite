import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
    CreateAdditionalBackupFlowResult,
    getCreateAdditionalBackupFlowResult,
} from '@suite-common/backup';
import { useAlert } from '@suite-native/alerts';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';
import {
    type CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { createAdditionalBackupThunk } from '@suite-native/nfc';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackNavigationProps<
    CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes.FollowInstructions
>;

export const CreateAdditionalBackupFollowInstructionsScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    useInterceptNativeNavigation();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleCreateAdditionalBackup.cancelAlert.title'),
            description: translate('moduleCreateAdditionalBackup.cancelAlert.description'),
            primaryButtonTitle: translate('moduleCreateAdditionalBackup.cancelAlert.primaryButton'),
            primaryButtonColorProps: { intent: 'warning', priority: 'primary' },
            secondaryButtonTitle: translate(
                'moduleCreateAdditionalBackup.cancelAlert.secondaryButton',
            ),
            secondaryButtonColorProps: { intent: 'warning', priority: 'secondary' },
            onPressPrimaryButton: () => {
                TrezorConnect.cancel();
                navigateToInitialScreen();
            },
        });
    }, [showAlert, translate, navigateToInitialScreen]);

    useOverrideBackNavigation({ onNavigateBack: handleExitButtonPress });

    const showCanceledOnTrezorAlert = useCallback(() => {
        showAlert({
            title: translate('moduleCreateAdditionalBackup.canceledOnTrezorAlert.title'),
            description: translate(
                'moduleCreateAdditionalBackup.canceledOnTrezorAlert.description',
            ),
            primaryButtonTitle: translate(
                'moduleCreateAdditionalBackup.canceledOnTrezorAlert.primaryButton',
            ),
            onPressPrimaryButton: () => {
                navigateToInitialScreen();
            },
            primaryButtonColorProps: { intent: 'warning', priority: 'primary' },
        });
    }, [showAlert, translate, navigateToInitialScreen]);

    useFocusEffect(
        useCallback(() => {
            const startBackupFlow = async () => {
                try {
                    const response = await dispatch(createAdditionalBackupThunk()).unwrap();
                    const flowResult = getCreateAdditionalBackupFlowResult(response);

                    if (flowResult === CreateAdditionalBackupFlowResult.Success) {
                        navigation.popTo(CreateAdditionalBackupStackRoutes.Success);

                        return;
                    }

                    if (flowResult === CreateAdditionalBackupFlowResult.CanceledOnTrezor) {
                        showCanceledOnTrezorAlert();

                        return;
                    }

                    if (flowResult === CreateAdditionalBackupFlowResult.Interrupted) {
                        navigateToInitialScreen();

                        return;
                    }

                    navigation.navigate(CreateAdditionalBackupStackRoutes.Error);
                } catch {
                    navigation.navigate(CreateAdditionalBackupStackRoutes.Error);
                }
            };
            startBackupFlow();
        }, [dispatch, navigation, navigateToInitialScreen, showCanceledOnTrezorAlert]),
    );

    return (
        <Screen
            noBottomPadding
            header={<ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />}
        >
            <ContinueOnTrezorScreenContent titleTxKey="moduleCreateAdditionalBackup.followInstructionsScreen.title" />
        </Screen>
    );
};
