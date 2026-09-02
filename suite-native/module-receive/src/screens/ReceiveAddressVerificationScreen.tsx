import { useCallback, useRef } from 'react';

import { type RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';

import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';
import {
    ReceiveAddressVerificationSource,
    type ReceiveAddressVerificationStackParamList,
    type ReceiveAddressVerificationStackRoutes,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { useReceiveAddressVerification } from '../hooks/useReceiveAddressVerification';

const getTitleTxKey = (source: ReceiveAddressVerificationSource) => {
    switch (source) {
        case ReceiveAddressVerificationSource.Pasted:
            return 'moduleReceive.addressVerificationScreen.pastedTitle';
        case ReceiveAddressVerificationSource.Shared:
            return 'moduleReceive.addressVerificationScreen.sharedTitle';
        case ReceiveAddressVerificationSource.Verified:
            return 'moduleReceive.addressVerificationScreen.verifiedTitle';
        default:
            return exhaustive(source);
    }
};

export const ReceiveAddressVerificationScreen = () => {
    const {
        params: { accountKey, addressPath, source },
    } =
        useRoute<
            RouteProp<
                ReceiveAddressVerificationStackParamList,
                ReceiveAddressVerificationStackRoutes.ContinueOnTrezor
            >
        >();
    const { verifyAddressOnDevice } = useReceiveAddressVerification(accountKey, addressPath);
    const hasStartedVerificationRef = useRef(false);

    // This screen becomes focused only after the connection guard is cleared. Start verification
    // here and guard against focus returning after device authorization.
    useFocusEffect(
        useCallback(() => {
            if (hasStartedVerificationRef.current) {
                return;
            }

            hasStartedVerificationRef.current = true;
            void verifyAddressOnDevice();
        }, [verifyAddressOnDevice]),
    );

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    useInterceptNativeNavigation({ onPress: handleCancel });

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent titleTxKey={getTitleTxKey(source)} />
        </DeviceInteractionScreenWrapper>
    );
};
