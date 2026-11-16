import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectSelectedDevice,
} from '@suite-common/device';
import { injectSignVerify } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

type VerifyMessageArgs = {
    account: Account;
    address: string;
    message: string;
    signature: string;
};

export const useVerifyMessage = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { signVerify } = useServices(injectSignVerify);
    const store = useStore<DeviceRootState>();

    return async ({
        account,
        address,
        message,
        signature,
    }: VerifyMessageArgs): Promise<VerifyMessageResult> => {
        navigation.navigate(RootStackRoutes.SignVerifyStack);

        const isDeviceReady = await waitForDevice();
        // Read after waiting: the device may have connected while the user was asked for it.
        const device = selectSelectedDevice(store.getState());
        if (!isDeviceReady || !isTrezorDeviceWithState(device)) {
            return 'cancelled';
        }

        const result = await signVerify.verify({
            device,
            account,
            address,
            message,
            signature,
            hex: false,
        });

        navigation.goBack();

        if (result.success) {
            return 'verified';
        }

        switch (result.error.type) {
            case 'DeviceCancelled':
                return 'cancelled';
            case 'DeviceError':
            case 'DeviceNotConnectedError':
            case 'SignVerifyNotSupported':
                return 'failed';
            default:
                return exhaustive(result.error);
        }
    };
};
