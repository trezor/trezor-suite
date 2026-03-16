import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import { useThpAutoconnectAlert } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { useThpScreenDismissal } from '../../hooks/useThpScreenDismissal';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    const { showEnableThpAutoconnectAlert } = useThpAutoconnectAlert();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);

    useInterceptNativeNavigation();
    useThpScreenDismissal();

    useFocusEffect(
        useCallback(() => {
            if (thpStep === 'CodeEntry') {
                navigation.replace(AuthorizeDeviceStackRoutes.ThpCodeEntry);
            } else if (thpAutoconnectStep === 'AutoconnectInfo') {
                showEnableThpAutoconnectAlert();
            }
        }, [thpStep, thpAutoconnectStep, showEnableThpAutoconnectAlert, navigation]),
    );

    return (
        <Screen
            header={<ThpScreenHeader />}
            isScrollable={false}
            noBottomPadding={true}
            hasBottomInset={false}
        >
            <ContinueOnTrezorScreenContent />
        </Screen>
    );
};
