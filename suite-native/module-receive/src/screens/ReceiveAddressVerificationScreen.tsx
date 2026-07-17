import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';
import {
    ReceiveAddressVerificationSource,
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

export const ReceiveAddressVerificationScreen = () => {
    const {
        params: { source },
    } = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAddressVerification>>();

    useInterceptNativeNavigation({ onPress: TrezorConnect.cancel });

    const titleTxKey =
        source === ReceiveAddressVerificationSource.Shared
            ? 'moduleReceive.addressVerificationScreen.sharedTitle'
            : 'moduleReceive.addressVerificationScreen.pastedTitle';

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent titleTxKey={titleTxKey} />
        </DeviceInteractionScreenWrapper>
    );
};
