import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { selectIsWipingDevice } from '@suite-native/device-authorization';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const WipeDeviceContinueOnTrezorScreen = () => {
    const navigation = useNavigation();
    const isWipeInProgress = useSelector(selectIsWipingDevice);

    useEffect(() => {
        // Prevent going back when wipe device is in progress
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (isWipeInProgress && e.data.action.type === 'GO_BACK') {
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [isWipeInProgress, navigation]);

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
